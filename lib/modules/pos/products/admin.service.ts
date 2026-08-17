import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { removeFileIfExists, saveUploadedFile } from '@/lib/utils/file-upload';
import { posProductRepository } from './repository';
import { mapProduct, mapProductDetailWithStocks, mapProductListItem, mapProductLookupBarcode } from './product.mapper';
import { getTenantCompanyUuid } from '@/lib/tenant-context';
import { assertProductLimit } from '@/lib/modules/billing/plan-limits';

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

function parseJsonArray<T>(value: any): T[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function parseAdditionalBarcodes(value: any): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === '') return [];

  if (Array.isArray(value)) {
    const result = value.map((item) => String(item).trim()).filter(Boolean);
    return result;
  }

  if (typeof value === 'string') {
    if (value.trim().startsWith('[')) {
      const parsed = parseJsonArray<string>(value);
      if (!parsed) return [];
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return undefined;
}

export function normalizeProductBody(raw: Record<string, any>) {
  const hasUnitConversions = raw.unit_conversions !== undefined || raw.unitConversions !== undefined;
  const parsedUnitConversions = hasUnitConversions
    ? (parseJsonArray<{ unit?: string; factor_to_base?: string | number; is_active?: boolean }>(
      raw.unit_conversions ?? raw.unitConversions
    ) ?? [])
    : undefined;
  const hasBranchPrices = raw.branch_prices !== undefined || raw.branchPrices !== undefined;
  const parsedBranchPrices = hasBranchPrices
    ? (parseJsonArray<{ branch_uuid?: string; selling_price?: string | number; wholesale_price?: string | number }>(
      raw.branch_prices ?? raw.branchPrices
    ) ?? [])
    : undefined;

  return {
    category_uuid: raw.category_uuid ?? raw.categoryUuid,
    name: raw.name,
    sku: raw.sku,
    barcode: raw.barcode,
    additional_barcodes: parseAdditionalBarcodes(raw.additional_barcodes ?? raw.additionalBarcodes),
    purchase_price: parseNumber(raw.purchase_price ?? raw.purchasePrice),
    selling_price: parseNumber(raw.selling_price ?? raw.sellingPrice),
    wholesale_price: parseNumber(raw.wholesale_price ?? raw.wholesalePrice),
    min_stock: parseNumber(raw.min_stock ?? raw.minStock),
    unit: raw.unit,
    unit_conversions: parsedUnitConversions
      ? parsedUnitConversions
          .filter((row) => row.unit && row.factor_to_base !== undefined && row.factor_to_base !== null && row.factor_to_base !== '')
          .map((row) => ({
            unit: String(row.unit).trim(),
            factor_to_base: Number(row.factor_to_base),
            is_active: row.is_active ?? true,
          }))
          .filter((row) => row.unit && !Number.isNaN(row.factor_to_base) && row.factor_to_base > 0)
      : undefined,
    branch_prices: parsedBranchPrices
      ? parsedBranchPrices
          .filter((row) => row.branch_uuid)
          .map((row) => ({
            branch_uuid: String(row.branch_uuid),
            selling_price: Number(row.selling_price ?? 0),
            wholesale_price: Number(row.wholesale_price ?? 0),
          }))
          .filter((row) => !Number.isNaN(row.selling_price) && !Number.isNaN(row.wholesale_price))
      : undefined,
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

export interface ProductBarcodePrintItem {
  uuid: string;
  name: string;
  sku: string;
  barcode: string;
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
        { additionalBarcodes: { some: { barcode: { contains: search, mode: 'insensitive' } } } },
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

    const companyUuid = getTenantCompanyUuid();
    if (companyUuid) {
      await assertProductLimit(companyUuid);
    }

    const existingSku = await posProductRepository.findBySku(payload.sku);
    if (existingSku) {
      throw new ValidationApiError({ sku: ['Kode produk sudah digunakan'] });
    }

    if (payload.barcode) {
      const existingBarcode = await posProductRepository.findByBarcode(payload.barcode);
      if (existingBarcode) {
        throw new ValidationApiError({ barcode: ['Barcode sudah digunakan'] });
      }
    }

    const additionalBarcodes = Array.isArray(payload.additional_barcodes) ? payload.additional_barcodes : [];
    const dedupedAdditionalBarcodes = [...new Set(additionalBarcodes.map((value: string) => value.trim()).filter(Boolean))];
    if (dedupedAdditionalBarcodes.length !== additionalBarcodes.length) {
      throw new ValidationApiError({ additional_barcodes: ['Barcode tambahan tidak boleh duplikat'] });
    }
    if (payload.barcode && dedupedAdditionalBarcodes.includes(payload.barcode)) {
      throw new ValidationApiError({ additional_barcodes: ['Barcode tambahan tidak boleh sama dengan barcode utama'] });
    }
    for (const barcode of dedupedAdditionalBarcodes) {
      const existing = await posProductRepository.findByBarcode(barcode);
      if (existing) {
        throw new ValidationApiError({ additional_barcodes: [`Barcode ${barcode} sudah digunakan`] });
      }
    }

    const product = await posProductRepository.create({
      categoryUuid: payload.category_uuid,
      name: payload.name,
      sku: payload.sku,
      barcode: payload.barcode || null,
      purchasePrice: payload.purchase_price ?? 0,
      sellingPrice: payload.selling_price,
      wholesalePrice: payload.wholesale_price ?? 0,
      minStock: payload.min_stock ?? 0,
      unit: payload.unit || 'pcs',
      isActive: payload.is_active ?? true,
    });

    if (dedupedAdditionalBarcodes.length > 0) {
      await posProductRepository.replaceAdditionalBarcodes(product.uuid, dedupedAdditionalBarcodes);
    }

    if (Array.isArray(payload.unit_conversions)) {
      await posProductRepository.replaceUnitConversions(product.uuid, payload.unit_conversions);
    }

    if (Array.isArray(payload.branch_prices)) {
      await posProductRepository.replaceBranchPrices(product.uuid, payload.branch_prices);
    }

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
        throw new ValidationApiError({ sku: ['Kode produk sudah digunakan'] });
      }
    }

    if (payload.barcode && payload.barcode !== existingProduct.barcode) {
      const barcodeExists = await posProductRepository.findByBarcode(payload.barcode);
      if (barcodeExists) {
        throw new ValidationApiError({ barcode: ['Barcode sudah digunakan'] });
      }
    }

    const additionalBarcodes = Array.isArray(payload.additional_barcodes)
      ? payload.additional_barcodes.map((value: string) => value.trim()).filter(Boolean)
      : undefined;
    if (additionalBarcodes) {
      const deduped = [...new Set(additionalBarcodes)];
      if (deduped.length !== additionalBarcodes.length) {
        throw new ValidationApiError({ additional_barcodes: ['Barcode tambahan tidak boleh duplikat'] });
      }
      const mainBarcode = payload.barcode ?? existingProduct.barcode;
      if (mainBarcode && deduped.includes(mainBarcode)) {
        throw new ValidationApiError({ additional_barcodes: ['Barcode tambahan tidak boleh sama dengan barcode utama'] });
      }

      for (const barcode of deduped) {
        const existing = await posProductRepository.findByAnyBarcodeExcludingProduct(barcode, uuid);
        if (existing) {
          throw new ValidationApiError({ additional_barcodes: [`Barcode ${barcode} sudah digunakan`] });
        }
      }
    }

    await posProductRepository.updateByUuid(uuid, {
      categoryUuid: payload.category_uuid ?? existingProduct.categoryUuid,
      name: payload.name ?? existingProduct.name,
      sku: payload.sku ?? existingProduct.sku,
      barcode: payload.barcode ?? existingProduct.barcode,
      purchasePrice: payload.purchase_price ?? existingProduct.purchasePrice,
      sellingPrice: payload.selling_price ?? existingProduct.sellingPrice,
      wholesalePrice: payload.wholesale_price ?? existingProduct.wholesalePrice,
      minStock: payload.min_stock ?? existingProduct.minStock,
      unit: payload.unit ?? existingProduct.unit,
      isActive: payload.is_active ?? existingProduct.isActive,
    });

    if (additionalBarcodes) {
      await posProductRepository.replaceAdditionalBarcodes(uuid, additionalBarcodes);
    }

    if (Array.isArray(payload.unit_conversions)) {
      await posProductRepository.replaceUnitConversions(uuid, payload.unit_conversions);
    }

    if (Array.isArray(payload.branch_prices)) {
      await posProductRepository.replaceBranchPrices(uuid, payload.branch_prices);
    }

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

  async getProductsForBarcodePdf(uuids: string[]): Promise<ProductBarcodePrintItem[]> {
    const uniqueUuids = [...new Set(uuids.map((uuid) => uuid.trim()).filter(Boolean))];
    if (uniqueUuids.length === 0) {
      throw new ValidationApiError({ uuids: ['Pilih minimal 1 produk'] });
    }

    const products = await posProductRepository.findManyByUuids(uniqueUuids);
    if (products.length === 0) {
      throw new ApiError('Produk tidak ditemukan', 404);
    }

    const byUuid = new Map(products.map((product) => [product.uuid, product]));
    const selected = uniqueUuids
      .map((uuid) => byUuid.get(uuid))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
      .map((product) => {
        const barcodeValue = (product.barcode || product.sku || '').trim();
        return {
          uuid: product.uuid,
          name: product.name,
          sku: product.sku,
          barcode: barcodeValue,
        };
      })
      .filter((product) => Boolean(product.barcode));

    if (selected.length === 0) {
      throw new ApiError('Produk terpilih tidak memiliki barcode/sku yang bisa diunduh', 422);
    }

    return selected;
  },
};
