export function formatRole(role: any) {
  return {
    id: role.id,
    name: role.name,
    guard_name: role.guardName,
    permissions: role.roleHasPermissions?.map((rp: any) => rp.permission.name) ?? [],
    permissions_count: role.roleHasPermissions?.length ?? role._count?.roleHasPermissions ?? 0,
    users_count: role._count?.modelHasRoles ?? 0,
    created_at: role.createdAt,
    updated_at: role.updatedAt,
  };
}
