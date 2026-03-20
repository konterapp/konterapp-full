export function mapSupplier(supplier: any) {
  return {
    uuid: supplier.uuid,
    code: supplier.code,
    name: supplier.name,
    contact_person: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    is_active: supplier.isActive,
    created_at: supplier.createdAt,
    updated_at: supplier.updatedAt,
  };
}

export function mapSupplierListItem(supplier: any) {
  const mapped = mapSupplier(supplier);
  return {
    uuid: mapped.uuid,
    code: mapped.code,
    name: mapped.name,
    contact_person: mapped.contact_person,
    phone: mapped.phone,
    email: mapped.email,
    address: mapped.address,
    is_active: mapped.is_active,
  };
}
