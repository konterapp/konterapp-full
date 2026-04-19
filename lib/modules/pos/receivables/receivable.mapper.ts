import { ReceivableSaleRow } from './repository';

export function mapReceivableSale(sale: ReceivableSaleRow) {
  const totalAmount = Number(sale.totalAmount || 0);
  const paidAmount = Number(sale.paidAmount || 0);
  const outstandingAmount = Math.max(totalAmount - paidAmount, 0);

  return {
    uuid: sale.uuid,
    sale_number: sale.saleNumber,
    sale_date: sale.saleDate,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    outstanding_amount: outstandingAmount,
    payment_status: sale.paymentStatus,
    branch: sale.branch
      ? { uuid: sale.branch.uuid, name: sale.branch.name, code: sale.branch.code }
      : null,
    customer: sale.customer
      ? { uuid: sale.customer.uuid, name: sale.customer.name, phone: sale.customer.phone }
      : null,
    payment_method: sale.paymentMethod
      ? { uuid: sale.paymentMethod.uuid, name: sale.paymentMethod.name, code: sale.paymentMethod.code }
      : null,
    creator: sale.creator
      ? { id: sale.creator.id, name: sale.creator.name, email: sale.creator.email }
      : null,
    created_at: sale.createdAt,
    updated_at: sale.updatedAt,
  };
}
