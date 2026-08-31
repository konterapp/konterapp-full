import type { PpobTransactionWithRelations } from './repository';

export function mapPpobTransactionType(row: { uuid: string; name: string; cashDirection: string; isActive: boolean; sortOrder: number; createdAt: Date; updatedAt: Date }) {
  return {
    uuid: row.uuid,
    name: row.name,
    cash_direction: row.cashDirection,
    is_active: row.isActive,
    sort_order: row.sortOrder,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function mapPpobTransaction(row: PpobTransactionWithRelations) {
  return {
    uuid: row.uuid,
    transaction_number: row.transactionNumber,
    cash_direction: row.cashDirection,
    account_reference: row.accountReference,
    base_amount: Number(row.baseAmount),
    selling_amount: Number(row.sellingAmount),
    admin_fee: Number(row.adminFee),
    // Laba bersih transaksi ini = (jual - modal) dikurangi biaya admin server
    // -- sengaja TIDAK dipaksa 0 kalau minus, biar kelihatan apa adanya.
    net_profit: Number(row.sellingAmount) - Number(row.baseAmount) - Number(row.adminFee),
    payment_method: row.paymentMethod
      ? { uuid: row.paymentMethod.uuid, code: row.paymentMethod.code, name: row.paymentMethod.name, type: row.paymentMethod.type }
      : null,
    paid_amount: Number(row.paidAmount),
    change_amount: Number(row.changeAmount),
    notes: row.notes,
    branch: row.branch ? { uuid: row.branch.uuid, name: row.branch.name, code: row.branch.code } : null,
    account: row.saldoAccount
      ? { uuid: row.saldoAccount.uuid, code: row.saldoAccount.code, name: row.saldoAccount.name }
      : null,
    transaction_type: row.transactionType
      ? { uuid: row.transactionType.uuid, name: row.transactionType.name, cash_direction: row.transactionType.cashDirection }
      : null,
    creator: row.creator ? { id: row.creator.id, name: row.creator.name } : null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}
