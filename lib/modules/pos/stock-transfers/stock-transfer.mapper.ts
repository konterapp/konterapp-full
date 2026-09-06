import type { TransferMovementRow } from './repository';

export function mapStockTransferHistoryItem(row: TransferMovementRow) {
  return {
    uuid: row.uuid,
    // Selalu ditampilkan sebagai angka positif -- dokumen transfer sudah
    // menyatakan arahnya lewat from_branch/to_branch, jadi tanda +/- pada
    // quantity mentah (yang membedakan sisi out/in) tidak relevan di sini.
    quantity: Math.abs(Number(row.quantity || 0)),
    product: row.product
      ? {
          uuid: row.product.uuid,
          name: row.product.name,
          sku: row.product.sku,
          unit: row.product.unit,
        }
      : null,
  };
}

export function mapStockTransferHistoryDocument(params: {
  referenceUuid: string;
  createdAt: Date;
  notes: string | null;
  fromBranch: TransferMovementRow['branch'];
  toBranch: TransferMovementRow['branch'];
  creator: TransferMovementRow['creator'];
  items: ReturnType<typeof mapStockTransferHistoryItem>[];
}) {
  const { referenceUuid, createdAt, notes, fromBranch, toBranch, creator, items } = params;

  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return {
    reference_uuid: referenceUuid,
    created_at: createdAt,
    notes,
    from_branch: fromBranch ? { uuid: fromBranch.uuid, name: fromBranch.name } : null,
    to_branch: toBranch ? { uuid: toBranch.uuid, name: toBranch.name } : null,
    creator: creator ? { id: creator.id, name: creator.name, email: creator.email } : null,
    items_count: items.length,
    total_quantity: totalQuantity,
    items,
  };
}
