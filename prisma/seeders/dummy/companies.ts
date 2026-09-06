/**
 * Dummy seeder untuk companies (tenant perusahaan).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/companies.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { seedTenantDefaultRoles } from "../../../lib/modules/roles/templates";

const COMPANIES_DATA = [
  {
    code: 'CMP-002',
    name: 'Konter Berkah Jaya',
    isActive: true,
    // Contoh company yang mengaktifkan "boleh jual stok minus" supaya
    // ada data dummy untuk setting POS ini.
    allowNegativeStock: true,
  },
  {
    code: 'CMP-003',
    name: 'Konter Sinar Abadi',
    isActive: true,
    allowNegativeStock: false,
  },
  {
    code: 'CMP-004',
    name: 'Konter Maju Bersama',
    isActive: false,
    allowNegativeStock: false,
  },
];

export async function seedCompanies(prisma: PrismaClient) {
  for (const data of COMPANIES_DATA) {
    const company = await prisma.company.upsert({
      where: { code: data.code },
      update: {
        allowNegativeStock: data.allowNegativeStock,
      },
      create: {
        uuid: uuidv7(),
        code: data.code,
        name: data.name,
        isActive: data.isActive,
        allowNegativeStock: data.allowNegativeStock,
      },
    });

    // Company dummy juga dapat role default tenant (administrator + kasir)
    await seedTenantDefaultRoles(prisma, company.uuid);
  }

  console.log(`✓ ${COMPANIES_DATA.length} companies dummy created`);
}
