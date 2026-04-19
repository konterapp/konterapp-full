function getStockStatus(stock: number, minStock: number) {
  if (stock <= 0) return 'out';
  if (stock <= minStock) return 'low';
  return 'safe';
}

type StockOnHandRow = {
  uuid: string;
  stock: number;
  updatedAt: Date;
  product: {
    uuid: string;
    name: string;
    sku: string;
    barcode: string | null;
    minStock: number;
    unit: string;
    isActive: boolean;
    category: {
      uuid: string;
      name: string;
    } | null;
  } | null;
  branch: {
    uuid: string;
    code: string;
    name: string;
  } | null;
};

export function mapStockOnHandListItem(item: StockOnHandRow) {
  const stock = Number(item.stock ?? 0);
  const minStock = Number(item.product?.minStock ?? 0);

  return {
    uuid: item.uuid,
    stock: stock,
    min_stock: minStock,
    stock_status: getStockStatus(stock, minStock),
    product: {
      uuid: item.product?.uuid,
      name: item.product?.name,
      sku: item.product?.sku,
      barcode: item.product?.barcode,
      unit: item.product?.unit,
      is_active: item.product?.isActive,
      category: item.product?.category
        ? {
            uuid: item.product.category.uuid,
            name: item.product.category.name,
          }
        : null,
    },
    branch: item.branch
      ? {
          uuid: item.branch.uuid,
          code: item.branch.code,
          name: item.branch.name,
        }
      : null,
    updated_at: item.updatedAt,
  };
}
