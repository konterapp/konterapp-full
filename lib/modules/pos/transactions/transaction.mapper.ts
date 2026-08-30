import { buildUploadFileUrl } from '@/lib/utils/file-upload';

type ProductImageRow = {
  image: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

type ProductWithImages = {
  images?: ProductImageRow[];
} | null | undefined;

function mapProductImage(product: ProductWithImages): string | null {
  if (!product || !Array.isArray(product.images) || product.images.length === 0) {
    return null;
  }

  const primary = product.images.find((img) => img.isPrimary) || product.images[0];
  return buildUploadFileUrl('products', primary?.image ?? null);
}

export function mapTransaction(sale: any) {
  return {
    uuid: sale.uuid,
    sale_number: sale.saleNumber,
    branch_uuid: sale.branchUuid,
    customer_uuid: sale.customerUuid,
    payment_method_uuid: sale.paymentMethodUuid,
    sale_date: sale.saleDate,
    subtotal: sale.subtotal,
    discount_amount: sale.discountAmount,
    total_amount: sale.totalAmount,
    paid_amount: sale.paidAmount,
    change_amount: sale.changeAmount,
    payment_status: sale.paymentStatus,
    notes: sale.notes,
    bank_agent_transaction_uuid: sale.bankAgentTransactionUuid ?? null,
    created_by: sale.createdBy,
    created_at: sale.createdAt,
    updated_at: sale.updatedAt,
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
    items: Array.isArray(sale.items)
      ? sale.items.map((item: any) => ({
          uuid: item.uuid,
          product_uuid: item.productUuid ?? item.product?.uuid,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
          product: item.product
            ? {
                uuid: item.product.uuid,
                name: item.product.name,
                sku: item.product.sku,
                image: mapProductImage(item.product),
              }
            : null,
        }))
      : [],
  };
}
