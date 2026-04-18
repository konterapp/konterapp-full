import { buildUploadFileUrl } from '@/lib/utils/file-upload';

const PRODUCT_UPLOAD_FOLDER = 'products';

export function mapProductImages(images: Array<{ uuid: string; image: string; isPrimary: boolean; sortOrder: number }>) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.map((img) => ({
    uuid: img.uuid,
    url: buildUploadFileUrl(PRODUCT_UPLOAD_FOLDER, img.image),
    is_primary: img.isPrimary,
    sort_order: img.sortOrder,
  }));
}

export function mapProduct(product: any) {
  const images = Array.isArray(product.images) ? mapProductImages(product.images) : [];
  const primary = images.find((img) => img.is_primary) ?? images[0];
  const additionalBarcodes = Array.isArray(product.additionalBarcodes)
    ? product.additionalBarcodes.map((item: any) => item.barcode)
    : [];
  const unitConversions = Array.isArray(product.unitConversions)
    ? product.unitConversions.map((item: any) => ({
        uuid: item.uuid,
        unit: item.unit,
        factor_to_base: Number(item.factorToBase),
        is_active: item.isActive,
      }))
    : [];
  const branchPrices = Array.isArray(product.branchPrices)
    ? product.branchPrices.map((item: any) => ({
        uuid: item.uuid,
        branch_uuid: item.branchUuid,
        branch_name: item.branch?.name ?? null,
        branch_code: item.branch?.code ?? null,
        selling_price: Number(item.sellingPrice),
        wholesale_price: Number(item.wholesalePrice),
      }))
    : [];

  return {
    uuid: product.uuid,
    category_uuid: product.categoryUuid,
    category: product.category,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    additional_barcodes: additionalBarcodes,
    purchase_price: Number(product.purchasePrice ?? 0),
    selling_price: Number(product.sellingPrice ?? 0),
    wholesale_price: Number(product.wholesalePrice ?? 0),
    min_stock: Number(product.minStock ?? 0),
    unit: product.unit,
    unit_conversions: unitConversions,
    branch_prices: branchPrices,
    is_active: product.isActive,
    images,
    image: primary ? primary.url : null,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

export function mapProductListItem(product: any, branchUuid: string | null) {
  const stockItems = Array.isArray(product.stockItems) ? product.stockItems : [];
  const stockData = stockItems.reduce((acc: Record<string, number>, item: any) => {
    acc[item.branchUuid] = item.stock;
    return acc;
  }, {});
  const branchPrice = branchUuid && Array.isArray(product.branchPrices)
    ? product.branchPrices.find((item: any) => item.branchUuid === branchUuid)
    : null;

  const totalStock = Object.values(stockData).reduce<number>((a, b) => a + Number(b), 0);
  const mapped = mapProduct(product);

  return {
    ...mapped,
    selling_price: branchPrice ? Number(branchPrice.sellingPrice) : mapped.selling_price,
    wholesale_price: branchPrice ? Number(branchPrice.wholesalePrice) : mapped.wholesale_price,
    total_stock: branchUuid ? stockData[branchUuid] || 0 : totalStock,
  };
}

export function mapProductDetailWithStocks(product: any) {
  return {
    ...mapProduct(product),
    stocks: product.stockItems.map((item: any) => ({
      branch_uuid: item.branchUuid,
      branch_name: item.branch.name,
      stock: item.stock,
    })),
  };
}

export function mapProductLookupBarcode(product: any, branchUuid?: string | null) {
  let availableStock = 0;
  if (branchUuid) {
    const stockItem = product.stockItems.find((item: any) => item.branchUuid === branchUuid);
    availableStock = stockItem ? stockItem.stock : 0;
  } else {
    availableStock = product.stockItems.reduce((sum: number, item: any) => sum + item.stock, 0);
  }

  const branchPrice = branchUuid && Array.isArray(product.branchPrices)
    ? product.branchPrices.find((item: any) => item.branchUuid === branchUuid)
    : null;
  const mapped = mapProduct(product);

  return {
    ...mapped,
    selling_price: branchPrice ? Number(branchPrice.sellingPrice) : mapped.selling_price,
    wholesale_price: branchPrice ? Number(branchPrice.wholesalePrice) : mapped.wholesale_price,
    available_stock: availableStock,
    stocks: product.stockItems.map((item: any) => ({
      branch_uuid: item.branchUuid,
      stock: item.stock,
    })),
  };
}
