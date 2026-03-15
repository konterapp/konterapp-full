import { PrismaClient, Role } from "@prisma/client";

async function assignPermissionsToRole(
  prisma: PrismaClient,
  role: Role,
  permissionNames: string[]
) {
  const permissions = await prisma.permission.findMany({
    where: { name: { in: permissionNames }, guardName: "web" },
  });

  for (const perm of permissions) {
    await prisma.roleHasPermission.upsert({
      where: {
        permissionId_roleId: {
          permissionId: perm.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        permissionId: perm.id,
        roleId: role.id,
      },
    });
  }

  return permissions.length;
}

export async function seedPermissionRole(
  prisma: PrismaClient,
  roles: { adminRole: Role; userRole: Role }
) {
  // Admin — semua permission
  const allPermissions = await prisma.permission.findMany({ where: { guardName: "web" } });
  const adminCount = await assignPermissionsToRole(
    prisma,
    roles.adminRole,
    allPermissions.map((p) => p.name)
  );
  console.log(`✓ ${adminCount} permissions assigned to admin role`);

  // User — permission spesifik
  const userCount = await assignPermissionsToRole(prisma, roles.userRole, [
    "admin.berita.index",
    "admin.berita.create",
    "admin.berita.update",
    "admin.berita.delete",
  ]);
  console.log(`✓ ${userCount} permissions assigned to user role`);
}
