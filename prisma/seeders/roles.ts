import { PrismaClient } from "@prisma/client";

export async function seedRoles(prisma: PrismaClient) {
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

  return { adminRole, userRole };
}
