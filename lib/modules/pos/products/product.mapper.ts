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

export function mapProductListItem(product: any, branchUuid: string | null) {
  const stockItems = Array.isArray(product.stockItems) ? product.stockItems : [];
  const stockData = stockItems.reduce((acc: Record<string, number>, item: any) => {
    acc[item.branchUuid] = item.stock;
    return acc;
  }, {});

  const totalStock = Object.values(stockData).reduce<number>((a, b) => a + Number(b), 0);
  const mapped = mapProduct(product);

  return {
    ...mapped,
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

  return {
    ...product,
    available_stock: availableStock,
    stocks: product.stockItems.map((item: any) => ({
      branch_uuid: item.branchUuid,
      stock: item.stock,
    })),
  };
}
