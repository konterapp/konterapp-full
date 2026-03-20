import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { removeFileIfExists, saveUploadedFile } from '@/lib/utils/file-upload';
import { posProductRepository } from './repository';
import { mapProduct, mapProductDetailWithStocks, mapProductListItem, mapProductLookupBarcode } from './product.mapper';

const PRODUCT_UPLOAD_FOLDER = 'products';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

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

export function normalizeProductBody(raw: Record<string, any>) {
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

async function saveProductImage(file: File) {
  return saveUploadedFile(file, {
    folder: PRODUCT_UPLOAD_FOLDER,
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSizeBytes: MAX_IMAGE_SIZE,
    fieldName: 'images',
  });
}

export const posProductService = {
  async listProducts(params: {
    page: number;
    perPage: number;
    search: string;
    categoryUuid: string | null;
    branchUuid: string | null;
    isActive: string | null;
    inStockOnly: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, perPage, search, categoryUuid, branchUuid, isActive, inStockOnly, sortBy, sortOrder } = params;

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

    if (categoryUuid) where.categoryUuid = categoryUuid;

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
      posProductRepository.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortOrder },
        branchUuid,
      }),
      posProductRepository.count(where),
    ]);

    const data = products.map((product: any) => mapProductListItem(product, branchUuid));

    return {
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async createProduct(payload: any, imageFiles: File[]) {
    if (!payload.selling_price && payload.selling_price !== 0) {
      throw new ValidationApiError({ selling_price: ['Harga jual wajib diisi'] });
    }

    const existingSku = await posProductRepository.findBySku(payload.sku);
    if (existingSku) {
      throw new ValidationApiError({ sku: ['SKU sudah digunakan'] });
    }

    if (payload.barcode) {
      const existingBarcode = await posProductRepository.findByBarcode(payload.barcode);
      if (existingBarcode) {
        throw new ValidationApiError({ barcode: ['Barcode sudah digunakan'] });
      }
    }

    const product = await posProductRepository.create({
      categoryUuid: payload.category_uuid,
      name: payload.name,
      sku: payload.sku,
      description: payload.description || null,
      barcode: payload.barcode || null,
      sellingPrice: payload.selling_price,
      minSellingPrice: payload.min_selling_price ?? null,
      minStock: payload.min_stock ?? 0,
      unit: payload.unit || 'pcs',
      isActive: payload.is_active ?? true,
    });

    for (let index = 0; index < imageFiles.length; index += 1) {
      const filename = await saveProductImage(imageFiles[index]);
      await posProductRepository.createImage({
        productUuid: product.uuid,
        image: filename,
        isPrimary: index === 0,
        sortOrder: index,
      });
    }

    const created = await posProductRepository.findByUuid(product.uuid);
    if (!created) {
      throw new ApiError('Product not found', 404);
    }

    return mapProduct(created);
  },

  async getProductDetail(uuid: string) {
    const product = await posProductRepository.findByUuid(uuid);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    return mapProductDetailWithStocks(product);
  },

  async updateProduct(
    uuid: string,
    payload: any,
    imageFiles: File[],
    deleteImages: string[],
    primaryImage: string | null
  ) {
    const existingProduct = await posProductRepository.findByUuid(uuid);
    if (!existingProduct) {
      throw new ApiError('Product not found', 404);
    }

    if (payload.sku && payload.sku !== existingProduct.sku) {
      const skuExists = await posProductRepository.findBySku(payload.sku);
      if (skuExists) {
        throw new ValidationApiError({ sku: ['SKU sudah digunakan'] });
      }
    }

    if (payload.barcode && payload.barcode !== existingProduct.barcode) {
      const barcodeExists = await posProductRepository.findByBarcode(payload.barcode);
      if (barcodeExists) {
        throw new ValidationApiError({ barcode: ['Barcode sudah digunakan'] });
      }
    }

    await posProductRepository.updateByUuid(uuid, {
      categoryUuid: payload.category_uuid ?? existingProduct.categoryUuid,
      name: payload.name ?? existingProduct.name,
      sku: payload.sku ?? existingProduct.sku,
      description: payload.description ?? existingProduct.description,
      barcode: payload.barcode ?? existingProduct.barcode,
      sellingPrice: payload.selling_price ?? existingProduct.sellingPrice,
      minSellingPrice: payload.min_selling_price ?? existingProduct.minSellingPrice,
      minStock: payload.min_stock ?? existingProduct.minStock,
      unit: payload.unit ?? existingProduct.unit,
      isActive: payload.is_active ?? existingProduct.isActive,
    });

    if (deleteImages.length > 0) {
      const imagesToDelete = await posProductRepository.findImagesByUuids(uuid, deleteImages);
      for (const img of imagesToDelete) {
        await removeFileIfExists(PRODUCT_UPLOAD_FOLDER, img.image);
      }
      await posProductRepository.deleteImagesByUuids(uuid, deleteImages);
    }

    if (imageFiles.length > 0) {
      const maxSort = await posProductRepository.aggregateMaxSortOrder(uuid);
      const startOrder = (maxSort._max.sortOrder ?? -1) + 1;

      for (let index = 0; index < imageFiles.length; index += 1) {
        const filename = await saveProductImage(imageFiles[index]);
        await posProductRepository.createImage({
          productUuid: uuid,
          image: filename,
          isPrimary: false,
          sortOrder: startOrder + index,
        });
      }
    }

    if (primaryImage) {
      await posProductRepository.setAllImagesNonPrimary(uuid);
      await posProductRepository.setImagePrimary(uuid, primaryImage);
    }

    const imagesAfter = await posProductRepository.findImagesByProduct(uuid);
    if (imagesAfter.length > 0 && !imagesAfter.some((img) => img.isPrimary)) {
      await posProductRepository.setImagePrimaryByUuid(imagesAfter[0].uuid);
    }

    const updated = await posProductRepository.findByUuid(uuid);
    if (!updated) {
      throw new ApiError('Product not found', 404);
    }

    return mapProductDetailWithStocks(updated);
  },

  async deleteProduct(uuid: string) {
    const product = await posProductRepository.findByUuid(uuid);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    const [saleItemsCount, purchaseItemsCount] = await posProductRepository.countTransactionItems(uuid);
    if (saleItemsCount > 0 || purchaseItemsCount > 0) {
      throw new ApiError('Cannot delete product with existing transactions', 400);
    }

    const images = await posProductRepository.findImagesByProduct(uuid);
    for (const img of images) {
      await removeFileIfExists(PRODUCT_UPLOAD_FOLDER, img.image);
    }

    await posProductRepository.deleteImagesByProduct(uuid);
    await posProductRepository.deleteByUuid(uuid);
  },

  async lookupBarcode(barcode: string, branchUuid?: string | null) {
    if (!barcode) {
      throw new ApiError('Barcode is required', 400);
    }

    const product = await posProductRepository.findActiveByBarcodeOrSku(barcode, branchUuid);
    if (!product) {
      throw new ApiError('Product not found', 404);
    }

    return mapProductLookupBarcode(product, branchUuid);
  },
};
