import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validationError } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { createProductSchema } from '@/lib/validations/product';
import { v7 as uuidv7 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const preferredRegion = "sin1";
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
  const images = Array.isArray(product.images) ? mapImages(product.images) : [];
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

// GET /api/admin/pos/products - List all products
export const GET = withPermission('admin.pos.product.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const categoryUuid = searchParams.get('category_uuid');
    const branchUuid = searchParams.get('branch_uuid');
    const isActive = searchParams.get('is_active');
    const inStockOnly = searchParams.get('in_stock');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryUuid) {
      where.categoryUuid = categoryUuid;
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === '1';
    }

    if (inStockOnly === 'true' && branchUuid) {
      where.stockItems = {
        some: {
          branchUuid,
          stock: { gt: 0 },
        },
      };
    }

    const sortFieldMap: Record<string, string> = {
      created_at: 'createdAt',
      name: 'name',
      sku: 'sku',
      selling_price: 'sellingPrice',
      min_stock: 'minStock',
      is_active: 'isActive',
    };
    const sortField = sortFieldMap[sortBy] ? sortBy : 'created_at';

    const [products, total] = await Promise.all([
      prisma.posProduct.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortOrder },
        include: {
          category: { select: { uuid: true, name: true } },
          stockItems: branchUuid
            ? {
                where: { branchUuid },
                select: { branchUuid: true, stock: true },
              }
            : true,
          images: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      prisma.posProduct.count({ where }),
    ]);

    const transformedProducts = products.map(product => {
      const stockItems = Array.isArray(product.stockItems) ? product.stockItems : [];
      const stockData = stockItems.reduce((acc, item) => {
        acc[item.branchUuid] = item.stock;
        return acc;
      }, {} as Record<string, number>);

      const totalStock = Object.values(stockData).reduce((a, b) => a + b, 0);
      const mapped = mapProduct(product);

      return {
        ...mapped,
        total_stock: branchUuid ? stockData[branchUuid] || 0 : totalStock,
      };
    });

    return successResponse('Products retrieved successfully', {
      data: transformedProducts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    return errorResponse(message, 500);
  }
});

// POST /api/admin/pos/products - Create new product
export const POST = withPermission('admin.pos.product.create', async (req: NextRequest) => {
  try {
    const contentType = req.headers.get('content-type') || '';
    let rawBody: Record<string, any> = {};
    let imageFiles: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      rawBody = Object.fromEntries(formData.entries());
      const images = formData.getAll('images[]');
      const altImages = formData.getAll('images');
      imageFiles = [...images, ...altImages].filter((file): file is File => file instanceof File);
    } else {
      rawBody = await req.json();
    }

    const body = normalizeProductBody(rawBody);
    const result = validateSchema(createProductSchema, body);
    if (!('data' in result)) return result;
    const validated = result.data;

    if (!validated.selling_price && validated.selling_price !== 0) {
      return validationError({ selling_price: ['Harga jual wajib diisi'] });
    }

    const existingProduct = await prisma.posProduct.findUnique({
      where: { sku: validated.sku },
    });

    if (existingProduct) {
      return validationError({ sku: ['SKU sudah digunakan'] });
    }

    if (validated.barcode) {
      const existingBarcode = await prisma.posProduct.findFirst({
        where: { barcode: validated.barcode },
      });

      if (existingBarcode) {
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

    const product = await prisma.posProduct.create({
      data: {
        categoryUuid: validated.category_uuid,
        name: validated.name,
        sku: validated.sku,
        description: validated.description || null,
        barcode: validated.barcode || null,
        sellingPrice: validated.selling_price,
        minSellingPrice: validated.min_selling_price ?? null,
        minStock: validated.min_stock ?? 0,
        unit: validated.unit || 'pcs',
        isActive: validated.is_active ?? true,
      },
    });

    if (imageFiles.length > 0) {
      for (let index = 0; index < imageFiles.length; index += 1) {
        const file = imageFiles[index];
        const filename = await saveImageFile(file);
        await prisma.posProductImage.create({
          data: {
            uuid: uuidv7(),
            productUuid: product.uuid,
            image: filename,
            isPrimary: index === 0,
            sortOrder: index,
          },
        });
      }
    }

    const created = await prisma.posProduct.findFirst({
      where: { uuid: product.uuid },
      include: {
        category: { select: { uuid: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return successResponse('Product created successfully', mapProduct(created));
  } catch (error: any) {
    console.error('Error creating product:', error);
    return errorResponse('Failed to create product', 500);
  }
});