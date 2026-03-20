export function mapPaymentMethod(paymentMethod: any) {
  return {
    uuid: paymentMethod.uuid,
    code: paymentMethod.code,
    name: paymentMethod.name,
    type: paymentMethod.type,
    accountNumber: paymentMethod.accountNumber,
    accountName: paymentMethod.accountName,
    description: paymentMethod.description,
    isActive: paymentMethod.isActive,
    createdAt: paymentMethod.createdAt,
    updatedAt: paymentMethod.updatedAt,
  };
}
