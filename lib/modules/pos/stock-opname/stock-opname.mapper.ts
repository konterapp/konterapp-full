type StockOpnameMovementRow = {
  uuid: string;
  createdAt: Date;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes: string | null;
  referenceUuid: string | null;
  product: {
    uuid: string;
    name: string;
    sku: string;
  } | null;
  branch: {
    uuid: string;
    name: string;
  } | null;
  creator: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export function mapStockOpnameHistoryItem(item: StockOpnameMovementRow) {
  return {
    uuid: item.uuid,
    quantity_change: item.quantity,
    quantity_before: item.previousStock,
    quantity_after: item.newStock,
    product: item.product
      ? {
          uuid: item.product.uuid,
          name: item.product.name,
          sku: item.product.sku,
        }
      : null,
  };
}

export function mapStockOpnameHistoryDocument(params: {
  referenceUuid: string;
  createdAt: Date;
  notes: string | null;
  branch: StockOpnameMovementRow['branch'];
  creator: StockOpnameMovementRow['creator'];
  items: ReturnType<typeof mapStockOpnameHistoryItem>[];
}) {
  const { referenceUuid, createdAt, notes, branch, creator, items } = params;

  const totalAdjustment = items.reduce((sum, item) => sum + Number(item.quantity_change || 0), 0);

  return {
    reference_uuid: referenceUuid,
    created_at: createdAt,
    notes,
    branch: branch
      ? {
          uuid: branch.uuid,
          name: branch.name,
        }
      : null,
    creator: creator
      ? {
          id: creator.id,
          name: creator.name,
          email: creator.email,
        }
      : null,
    items_count: items.length,
    total_adjustment: totalAdjustment,
    items,
  };
}
