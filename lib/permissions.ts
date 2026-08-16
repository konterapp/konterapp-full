import { prisma } from "./prisma";
import { PERMISSIONS, type Permission } from "@/lib/modules/roles/permissions";

const USER_MODEL_TYPE = "App\\Models\\User";

/** Semua permission di katalog (dipakai untuk role full-access / administrator). */
export function getAllPermissions(): Permission[] {
  return [...PERMISSIONS];
}

/** Role user di dalam satu company aktif. */
export async function getUserRoles(userId: number, companyUuid: string): Promise<string[]> {
  const roles = await prisma.modelHasRole.findMany({
    where: { modelId: userId, modelType: USER_MODEL_TYPE, companyUuid },
    include: { role: true },
  });
  return roles.map((r) => r.role.name);
}

/**
 * Permission user DI DALAM company tertentu. Multi-tenant: hanya role milik
 * company tsb yang dihitung. Jika salah satu role-nya full-access
 * (default: administrator), kembalikan seluruh katalog permission.
 */
export async function getUserPermissions(userId: number, companyUuid: string): Promise<string[]> {
  const assignments = await prisma.modelHasRole.findMany({
    where: { modelId: userId, modelType: USER_MODEL_TYPE, companyUuid },
    include: {
      role: {
        include: {
          roleHasPermissions: true,
        },
      },
    },
  });

  if (assignments.some((a) => a.role.isFullAccess)) {
    return getAllPermissions();
  }

  return [
    ...new Set(
      assignments.flatMap((a) => a.role.roleHasPermissions.map((rp) => rp.permissionName))
    ),
  ];
}

export function hasPermission(
  userPermissions: string[],
  permission: string
): boolean {
  return userPermissions.includes(permission);
}

export function hasAnyPermission(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}
