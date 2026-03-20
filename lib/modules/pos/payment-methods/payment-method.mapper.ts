export function mapPaymentMethod(paymentMethod: any) {
  return {
    uuid: paymentMethod.uuid,
    code: paymentMethod.code,
    name: paymentMethod.name,
    type: paymentMethod.type,
    account_number: paymentMethod.accountNumber,
    account_name: paymentMethod.accountName,
    description: paymentMethod.description,
    is_active: paymentMethod.isActive,
    created_at: paymentMethod.createdAt,
    updated_at: paymentMethod.updatedAt,
  };
}
