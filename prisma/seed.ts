import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v7 as uuidv7 } from "uuid";

const prisma = new PrismaClient();

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
];

async function main() {
  // Create permissions
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { permissions_name_guard_name_unique: { name, guardName: "web" } },
      update: {},
      create: { name, guardName: "web" },
    });
  }
  console.log(`✓ ${PERMISSIONS.length} permissions created`);

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { roles_name_guard_name_unique: { name: "admin", guardName: "web" } },
    update: {},
    create: { name: "admin", guardName: "web" },
  });

  const userRole = await prisma.role.upsert({
    where: { roles_name_guard_name_unique: { name: "user", guardName: "web" } },
    update: {},
    create: { name: "user", guardName: "web" },
  });
  console.log("✓ Roles created: admin, user");

  // Assign all permissions to admin role
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.roleHasPermission.upsert({
      where: {
        permissionId_roleId: {
          permissionId: perm.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        permissionId: perm.id,
        roleId: adminRole.id,
      },
    });
  }
  console.log(`✓ ${allPermissions.length} permissions assigned to admin role`);

  // Create default admin user
  const hashedPassword = await bcrypt.hash("password", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@eventbyid.com" },
    update: {},
    create: {
      uuid: uuidv7(),
      name: "Admin",
      email: "admin@eventbyid.com",
      password: hashedPassword,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create admin profile
  await prisma.userProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      userType: 2, // admin
    },
  });

  // Assign admin role
  await prisma.modelHasRole.upsert({
    where: {
      roleId_modelType_modelId: {
        roleId: adminRole.id,
        modelType: "App\\Models\\User",
        modelId: adminUser.id,
      },
    },
    update: {},
    create: {
      roleId: adminRole.id,
      modelType: "App\\Models\\User",
      modelId: adminUser.id,
    },
  });
  console.log("✓ Admin user created: admin@eventbyid.com / password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
