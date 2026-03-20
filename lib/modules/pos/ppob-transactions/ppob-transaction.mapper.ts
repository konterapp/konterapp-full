export function mapPpobTransaction(transaction: any) {
  return {
    uuid: transaction.uuid,
    transaction_number: transaction.transactionNumber,
    type: transaction.type,
    product_code: transaction.productCode,
    product_name: transaction.productName,
    customer_number: transaction.customerNumber,
    customer_name: transaction.customerName,
    amount: Number(transaction.amount),
    admin_fee: Number(transaction.adminFee),
    selling_price: Number(transaction.sellingPrice),
    profit: Number(transaction.profit),
    provider: transaction.provider,
    provider_label: transaction.provider === 'rajabiller' ? 'RajaBiller' : transaction.provider === 'digiflazz' ? 'Digiflazz' : transaction.provider,
    status: transaction.status,
    status_label:
      transaction.status === 'success'
        ? 'Sukses'
        : transaction.status === 'failed'
          ? 'Gagal'
          : transaction.status === 'pending'
            ? 'Pending'
            : transaction.status,
    provider_reference: transaction.providerReference,
    provider_response: transaction.providerResponse,
    notes: transaction.notes,
    branch_uuid: transaction.branchUuid,
    branch: transaction.branch
      ? {
          uuid: transaction.branch.uuid,
          name: transaction.branch.name,
        }
      : null,
    payment_method_uuid: transaction.paymentMethodUuid,
    payment_method: transaction.paymentMethod
      ? {
          uuid: transaction.paymentMethod.uuid,
          name: transaction.paymentMethod.name,
          type: transaction.paymentMethod.type,
        }
      : null,
    created_by: transaction.createdBy,
    creator: transaction.creator
      ? {
          id: transaction.creator.id,
          name: transaction.creator.name,
          email: transaction.creator.email,
        }
      : null,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
  };
}
