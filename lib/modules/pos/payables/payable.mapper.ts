import { PayablePurchaseRow } from './repository';

export function mapPayablePurchase(purchase: PayablePurchaseRow) {
  const totalAmount = Number(purchase.totalAmount || 0);
  const paidAmount = Number(purchase.paidAmount || 0);
  const outstandingAmount = Math.max(totalAmount - paidAmount, 0);

  return {
    uuid: purchase.uuid,
    purchase_number: purchase.purchaseNumber,
    purchase_date: purchase.purchaseDate,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    outstanding_amount: outstandingAmount,
    payment_status: purchase.paymentStatus,
    branch: purchase.branch
      ? { uuid: purchase.branch.uuid, name: purchase.branch.name, code: purchase.branch.code }
      : null,
    supplier: purchase.supplier
      ? {
          uuid: purchase.supplier.uuid,
          name: purchase.supplier.name,
          code: purchase.supplier.code,
          phone: purchase.supplier.phone,
        }
      : null,
    creator: purchase.creator
      ? { id: purchase.creator.id, name: purchase.creator.name, email: purchase.creator.email }
      : null,
    created_at: purchase.createdAt,
    updated_at: purchase.updatedAt,
  };
}
