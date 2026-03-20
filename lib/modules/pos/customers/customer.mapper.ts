export function mapCustomer(customer: any) {
  return {
    uuid: customer.uuid,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}
