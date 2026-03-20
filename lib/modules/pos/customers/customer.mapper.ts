export function mapCustomer(customer: any) {
  return {
    uuid: customer.uuid,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
