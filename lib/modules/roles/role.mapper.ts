import type { Role } from "@prisma/client";

interface RoleWithRelations extends Role {
  roleHasPermissions?: { permissionName: string }[];
  _count?: { modelHasRoles?: number };
}

export function mapRole(role: RoleWithRelations) {
  return {
    uuid: role.uuid,
    name: role.name,
    is_full_access: role.isFullAccess,
    permissions: (role.roleHasPermissions ?? []).map((rp) => rp.permissionName),
    user_count: role._count?.modelHasRoles ?? 0,
    created_at: role.createdAt,
    updated_at: role.updatedAt,
  };
}
