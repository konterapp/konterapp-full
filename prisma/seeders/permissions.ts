import { PrismaClient } from "@prisma/client";

const PERMISSIONS = [
  // User management
  "admin.user.index",
  "admin.user.create",
  "admin.user.update",
  "admin.user.delete",
  // Role management
  "admin.role.index",
  "admin.role.create",
  "admin.role.update",
  "admin.role.delete",
  // Berita management
  "admin.berita.index",
  "admin.berita.create",
  "admin.berita.update",
  "admin.berita.delete",
];

export async function seedPermissions(prisma: PrismaClient) {
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { permissions_name_guard_name_unique: { name, guardName: "web" } },
      update: {},
      create: { name, guardName: "web" },
    });
  }
  console.log(`✓ ${PERMISSIONS.length} permissions created`);
}
