import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./users";
import { ensureDefaultCompany, getDefaultCompanyUuid } from "./company";
import { seedAdministrators } from "./administrators";
import { seedPlans } from "./plans";
import { seedTenantDefaultRoles } from "../../lib/modules/roles/templates";

/**
 * Seeding inti yang wajib ada di setiap environment (company default + role
 * default tenant, users default, administrator default, katalog plan).
 * Dipakai bersama oleh seed.ts (npm run seed) dan dummy/index.ts
 * (npm run seed:dummy) supaya tidak duplikasi & tidak drift.
 */
export async function seedCore(prisma: PrismaClient) {
  await ensureDefaultCompany(prisma);
  const companyUuid = await getDefaultCompanyUuid(prisma);
  await seedTenantDefaultRoles(prisma, companyUuid);
  await seedUsers(prisma);
  await seedAdministrators(prisma);
  await seedPlans(prisma);
}
