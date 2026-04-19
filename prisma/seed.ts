import { PrismaClient } from "@prisma/client";
import { seedPermissions } from "./seeders/permissions";
import { seedRoles } from "./seeders/roles";
import { seedPermissionRole } from "./seeders/permission-role";
import { seedUsers } from "./seeders/users";
import { ensureDefaultCompany } from "./seeders/company";

const prisma = new PrismaClient();

async function main() {
  await ensureDefaultCompany(prisma);
  await seedPermissions(prisma);
  const roles = await seedRoles(prisma);
  await seedPermissionRole(prisma, roles);
  await seedUsers(prisma, roles);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
