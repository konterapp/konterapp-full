/**
 * Dummy seeder untuk satuan produk POS.
 * Jalankan: npm run seed:dummy:file prisma/seeders/dummy/units.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";

const UNITS_DATA = [
  { name: "pcs", description: "Satuan per item" },
  { name: "bungkus", description: "Satuan kemasan/bungkus" },
  { name: "box", description: "Satuan dus/kotak" },
  { name: "pack", description: "Satuan pak isi beberapa item" },
  { name: "botol", description: "Satuan botol" },
  { name: "liter", description: "Satuan volume liter" },
  { name: "kg", description: "Satuan berat kilogram" },
];

export async function seedUnits(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  let createdOrUpdated = 0;

  for (const data of UNITS_DATA) {
    const existing = await prisma.posProductUnit.findFirst({
      where: {
        companyUuid,
        name: data.name,
      },
    });

    if (existing) {
      await prisma.posProductUnit.update({
        where: { uuid: existing.uuid },
        data: { description: data.description },
      });
      createdOrUpdated += 1;
      continue;
    }

    await prisma.posProductUnit.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        name: data.name,
        description: data.description,
      },
    });
    createdOrUpdated += 1;
  }

  console.log(`✓ ${createdOrUpdated} units dummy created/updated`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedUnits(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
