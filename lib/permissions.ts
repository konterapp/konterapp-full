import { prisma } from "./prisma";

export async function getUserRoles(userId: number): Promise<string[]> {
  const roles = await prisma.modelHasRole.findMany({
    where: { modelId: userId, modelType: "App\\Models\\User" },
    include: { role: true },
  });
  return roles.map((r) => r.role.name);
}

export async function getUserPermissions(userId: number): Promise<string[]> {
  // Get permissions from roles
  const rolePermissions = await prisma.modelHasRole.findMany({
    where: { modelId: userId, modelType: "App\\Models\\User" },
    include: {
      role: {
        include: {
          roleHasPermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permFromRoles = rolePermissions.flatMap((r) =>
    r.role.roleHasPermissions.map((rp) => rp.permission.name)
  );

  // Get direct permissions
  const directPermissions = await prisma.modelHasPermission.findMany({
    where: { modelId: userId, modelType: "App\\Models\\User" },
    include: { permission: true },
  });

  const permDirect = directPermissions.map((dp) => dp.permission.name);

  // Merge and deduplicate
  return [...new Set([...permFromRoles, ...permDirect])];
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
