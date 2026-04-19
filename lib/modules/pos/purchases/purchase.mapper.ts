import { PurchaseDetailRow, PurchaseListRow } from './repository';

export function mapPurchaseListItem(purchase: PurchaseListRow) {
  const totalAmount = Number(purchase.totalAmount || 0);
  const paidAmount = Number(purchase.paidAmount || 0);

  return {
    uuid: purchase.uuid,
    purchase_number: purchase.purchaseNumber,
    purchase_date: purchase.purchaseDate,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    outstanding_amount: Math.max(totalAmount - paidAmount, 0),
    payment_status: purchase.paymentStatus,
    branch: purchase.branch
      ? { uuid: purchase.branch.uuid, name: purchase.branch.name, code: purchase.branch.code }
      : null,
    supplier: purchase.supplier
      ? { uuid: purchase.supplier.uuid, name: purchase.supplier.name, code: purchase.supplier.code, phone: purchase.supplier.phone }
      : null,
  };
}

export function mapPurchaseDetail(purchase: PurchaseDetailRow) {
  const subtotal = Number(purchase.subtotal || 0);
  const discountAmount = Number(purchase.discountAmount || 0);
  const totalAmount = Number(purchase.totalAmount || 0);
  const paidAmount = Number(purchase.paidAmount || 0);

  return {
    uuid: purchase.uuid,
    purchase_number: purchase.purchaseNumber,
    branch_uuid: purchase.branchUuid,
    supplier_uuid: purchase.supplierUuid,
    purchase_date: purchase.purchaseDate,
    subtotal,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    outstanding_amount: Math.max(totalAmount - paidAmount, 0),
    payment_status: purchase.paymentStatus,
    notes: purchase.notes,
    created_by: purchase.createdBy,
    created_at: purchase.createdAt,
    updated_at: purchase.updatedAt,
    branch: purchase.branch
      ? { uuid: purchase.branch.uuid, name: purchase.branch.name, code: purchase.branch.code }
      : null,
    supplier: purchase.supplier
      ? { uuid: purchase.supplier.uuid, name: purchase.supplier.name, code: purchase.supplier.code, phone: purchase.supplier.phone }
      : null,
    creator: purchase.creator
      ? { id: purchase.creator.id, name: purchase.creator.name, email: purchase.creator.email }
      : null,
    items: Array.isArray(purchase.items)
      ? purchase.items.map((item) => ({
          uuid: item.uuid,
          product_uuid: item.productUuid ?? item.product?.uuid,
          quantity: Number(item.quantity || 0),
          unit: item.purchaseUnit,
          factor_to_base: Number(item.factorToBase || 1),
          quantity_base: Number(item.quantityBase || item.quantity || 0),
          unit_price: Number(item.unitPrice || 0),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0),
          product: item.product
            ? {
                uuid: item.product.uuid,
                name: item.product.name,
                sku: item.product.sku,
                unit: item.product.unit,
              }
            : null,
        }))
      : [],
  };
}
