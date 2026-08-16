import { PrismaClient } from "@prisma/client";
import { seedPermissions } from "./permissions";
import { seedRoles } from "./roles";
import { seedPermissionRole } from "./permission-role";
import { seedUsers } from "./users";
import { ensureDefaultCompany } from "./company";
import { seedAdministrators } from "./administrators";
import { seedPlans } from "./plans";

/**
 * Seeding inti yang wajib ada di setiap environment (permissions, roles,
 * users default, administrator default, perusahaan default, katalog plan).
 * Dipakai bersama oleh seed.ts (npm run seed) dan dummy/index.ts
 * (npm run seed:dummy) supaya tidak duplikasi & tidak drift.
 */
export async function seedCore(prisma: PrismaClient) {
  await ensureDefaultCompany(prisma);
  await seedPermissions(prisma);
  const roles = await seedRoles(prisma);
  await seedPermissionRole(prisma, roles);
  await seedUsers(prisma, roles);
  await seedAdministrators(prisma);
  await seedPlans(prisma);
  return roles;
}
