import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validationError } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { updateProductSchema } from '@/lib/validations/product';
import { v7 as uuidv7 } from 'uuid';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const maxImageSize = 2 * 1024 * 1024;

function parseBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return undefined;
}

function parseNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function normalizeProductBody(raw: Record<string, any>) {
  return {
    category_uuid: raw.category_uuid ?? raw.categoryUuid,
    name: raw.name,
    sku: raw.sku,
    description: raw.description,
    barcode: raw.barcode,
    selling_price: parseNumber(raw.selling_price ?? raw.sellingPrice),
    min_selling_price: parseNumber(raw.min_selling_price ?? raw.minSellingPrice),
    min_stock: parseNumber(raw.min_stock ?? raw.minStock),
    unit: raw.unit,
    is_active: parseBoolean(raw.is_active ?? raw.isActive),
  };
}

function mapImages(images: Array<{ uuid: string; image: string; isPrimary: boolean; sortOrder: number }>) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.map((img) => ({
    uuid: img.uuid,
    url: `/uploads/products/${img.image}`,
    is_primary: img.isPrimary,
    sort_order: img.sortOrder,
  }));
}

function mapProduct(product: any) {
  const images = product.images ? mapImages(product.images) : [];
  const primary = images.find((img) => img.is_primary) ?? images[0];

  return {
    uuid: product.uuid,
    category_uuid: product.categoryUuid,
    category: product.category,
    name: product.name,
    sku: product.sku,
    description: product.description,
    barcode: product.barcode,
    selling_price: product.sellingPrice,
    min_selling_price: product.minSellingPrice,
    min_stock: product.minStock,
    unit: product.unit,
    is_active: product.isActive,
    images,
    image: primary ? primary.url : null,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

async function saveImageFile(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${uuidv7()}_${file.name}`;
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);
  return filename;
}

async function deleteImageFile(filename: string | null) {
  if (!filename) return;
  try {
    await unlink(join(uploadDir, filename));
  } catch {
    // ignore missing files
  }
}

// GET /api/admin/pos/products/[uuid] - Get product detail
export const GET = withPermission(
  'admin.pos.product.index',
  async (_req: NextRequest, context) => {
    try {
      const { uuid } = await context.params;

      const product = await prisma.posProduct.findFirst({
        where: { uuid },
        include: {
          category: { select: { uuid: true, name: true } },
          stockItems: {
            include: { branch: { select: { uuid: true, name: true, code: true } } },
          },
          images: { orderBy: { sortOrder: 'asc' } },
        },
      });

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      return successResponse('Product retrieved successfully', {
        ...mapProduct(product),
        stocks: product.stockItems.map(item => ({
          branch_uuid: item.branchUuid,
          branch_name: item.branch.name,
          stock: item.stock,
        })),
      });
    } catch (error: any) {
      console.error('Error fetching product:', error);
      return errorResponse('Failed to fetch product', 500);
    }
  }
);

// PATCH /api/admin/pos/products/[uuid] - Update product
export const PATCH = withPermission(
  'admin.pos.product.update',
  async (req: NextRequest, context) => {
    try {
      const { uuid } = await context.params;
      const contentType = req.headers.get('content-type') || '';
      let rawBody: Record<string, any> = {};
      let imageFiles: File[] = [];
      let deleteImages: string[] = [];
      let primaryImage: string | null = null;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        rawBody = Object.fromEntries(formData.entries());
        const images = formData.getAll('images[]');
        const altImages = formData.getAll('images');
        imageFiles = [...images, ...altImages].filter((file): file is File => file instanceof File);
        deleteImages = formData.getAll('delete_images[]').map(String);
        if (deleteImages.length === 0) {
          deleteImages = formData.getAll('delete_images').map(String);
        }
        const primary = formData.get('primary_image');
        primaryImage = primary ? String(primary) : null;
      } else {
        rawBody = await req.json();
        deleteImages = Array.isArray(rawBody.delete_images) ? rawBody.delete_images : [];
        primaryImage = rawBody.primary_image ?? null;
      }

      const body = normalizeProductBody(rawBody);
      const result = validateSchema(updateProductSchema, body);
      if (!('data' in result)) return result;
      const validated = result.data;

      const existingProduct = await prisma.posProduct.findFirst({
        where: { uuid },
      });

      if (!existingProduct) {
        return errorResponse('Product not found', 404);
      }

      if (validated.sku && validated.sku !== existingProduct.sku) {
        const skuExists = await prisma.posProduct.findUnique({
          where: { sku: validated.sku },
        });

        if (skuExists) {
          return validationError({ sku: ['SKU sudah digunakan'] });
        }
      }

      if (validated.barcode && validated.barcode !== existingProduct.barcode) {
        const barcodeExists = await prisma.posProduct.findFirst({
          where: { barcode: validated.barcode },
        });

        if (barcodeExists) {
          return validationError({ barcode: ['Barcode sudah digunakan'] });
        }
      }

      for (const file of imageFiles) {
        if (!allowedImageTypes.includes(file.type)) {
          return validationError({ images: ['Gambar harus berupa jpg, jpeg, png, atau webp'] });
        }
        if (file.size > maxImageSize) {
          return validationError({ images: ['Gambar maksimal 2MB'] });
        }
      }

      await prisma.posProduct.update({
        where: { uuid },
        data: {
          categoryUuid: validated.category_uuid ?? existingProduct.categoryUuid,
          name: validated.name ?? existingProduct.name,
          sku: validated.sku ?? existingProduct.sku,
          description: validated.description ?? existingProduct.description,
          barcode: validated.barcode ?? existingProduct.barcode,
          sellingPrice: validated.selling_price ?? existingProduct.sellingPrice,
          minSellingPrice: validated.min_selling_price ?? existingProduct.minSellingPrice,
          minStock: validated.min_stock ?? existingProduct.minStock,
          unit: validated.unit ?? existingProduct.unit,
          isActive: validated.is_active ?? existingProduct.isActive,
        },
      });

      if (deleteImages.length > 0) {
        const imagesToDelete = await prisma.posProductImage.findMany({
          where: {
            productUuid: uuid,
            uuid: { in: deleteImages },
          },
        });

        for (const img of imagesToDelete) {
          await deleteImageFile(img.image);
        }

        await prisma.posProductImage.deleteMany({
          where: {
            productUuid: uuid,
            uuid: { in: deleteImages },
          },
        });
      }

      if (imageFiles.length > 0) {
        const maxSort = await prisma.posProductImage.aggregate({
          where: { productUuid: uuid },
          _max: { sortOrder: true },
        });
        const startOrder = (maxSort._max.sortOrder ?? -1) + 1;

        for (let index = 0; index < imageFiles.length; index += 1) {
          const file = imageFiles[index];
          const filename = await saveImageFile(file);
          await prisma.posProductImage.create({
            data: {
              uuid: uuidv7(),
              productUuid: uuid,
              image: filename,
              isPrimary: false,
              sortOrder: startOrder + index,
            },
          });
        }
      }

      if (primaryImage) {
        await prisma.posProductImage.updateMany({
          where: { productUuid: uuid },
          data: { isPrimary: false },
        });
        await prisma.posProductImage.updateMany({
          where: { productUuid: uuid, uuid: primaryImage },
          data: { isPrimary: true },
        });
      }

      const imagesAfter = await prisma.posProductImage.findMany({
        where: { productUuid: uuid },
        orderBy: { sortOrder: 'asc' },
      });

      if (imagesAfter.length > 0 && !imagesAfter.some((img) => img.isPrimary)) {
        await prisma.posProductImage.update({
          where: { uuid: imagesAfter[0].uuid },
          data: { isPrimary: true },
        });
      }

      const updated = await prisma.posProduct.findFirst({
        where: { uuid },
        include: {
          category: { select: { uuid: true, name: true } },
          stockItems: {
            include: { branch: { select: { uuid: true, name: true, code: true } } },
          },
          images: { orderBy: { sortOrder: 'asc' } },
        },
      });
      if (!updated) {
        return errorResponse('Product not found', 404);
      }

      return successResponse('Product updated successfully', {
        ...mapProduct(updated),
        stocks: updated.stockItems.map(item => ({
          branch_uuid: item.branchUuid,
          branch_name: item.branch.name,
          stock: item.stock,
        })),
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      return errorResponse('Failed to update product', 500);
    }
  }
);

// PUT /api/admin/pos/products/[uuid] - Update product (alias)
export const PUT = PATCH;

// DELETE /api/admin/pos/products/[uuid] - Delete product
export const DELETE = withPermission(
  'admin.pos.product.delete',
  async (_req: NextRequest, context) => {
    try {
      const { uuid } = await context.params;

      const product = await prisma.posProduct.findFirst({
        where: { uuid },
      });

      if (!product) {
        return errorResponse('Product not found', 404);
      }

      const [saleItemsCount, purchaseItemsCount] = await Promise.all([
        prisma.posSaleItem.count({ where: { productUuid: uuid } }),
        prisma.posPurchaseItem.count({ where: { productUuid: uuid } }),
      ]);

      if (saleItemsCount > 0 || purchaseItemsCount > 0) {
        return errorResponse('Cannot delete product with existing transactions', 400);
      }

      const images = await prisma.posProductImage.findMany({ where: { productUuid: uuid } });
      for (const img of images) {
        await deleteImageFile(img.image);
      }
      await prisma.posProductImage.deleteMany({ where: { productUuid: uuid } });

      await prisma.posProduct.delete({ where: { uuid } });

      return successResponse('Product deleted successfully', null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      return errorResponse('Failed to delete product', 500);
    }
  }
);
