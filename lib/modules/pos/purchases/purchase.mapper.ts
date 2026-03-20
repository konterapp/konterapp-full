export function mapPurchaseListItem(purchase: any) {
  return {
    uuid: purchase.uuid,
    purchase_number: purchase.purchaseNumber,
    purchase_date: purchase.purchaseDate,
    total_amount: Number(purchase.totalAmount),
    payment_status: purchase.paymentStatus,
    branch: purchase.branch,
    supplier: purchase.supplier,
  };
}
