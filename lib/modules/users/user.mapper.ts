export function formatUser(user: any, permissions?: string[]) {
  const roles = user.modelHasRoles?.map((r: any) => r.role.name) ?? [];
  const companies = user.companyMemberships
    ?.filter((m: any) => m.isActive)
    .map((m: any) => ({
      uuid: m.company.uuid,
      code: m.company.code,
      name: m.company.name,
      is_default: m.isDefault,
    })) ?? [];
  const result: any = {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    is_active: user.isActive,
    email_verified_at: user.emailVerifiedAt ?? null,
    roles,
    companies,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };

  if (permissions) {
    result.permissions = permissions;
  }

  return result;
}
