export function formatCompany(company: any) {
  return {
    uuid: company.uuid,
    code: company.code,
    name: company.name,
    is_active: company.isActive,
    users_count: company._count?.memberships ?? 0,
    branches_count: company._count?.branches ?? 0,
    created_at: company.createdAt,
    updated_at: company.updatedAt,
  };
}
