/**
 * Dummy seeder untuk kategori produk.
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/categories.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";

const CATEGORIES_DATA = [
  {
    name: 'Pulsa & Paket Data',
    description: 'Produk pulsa dan paket data untuk semua operator',
  },
  {
    name: 'Aksesoris HP',
    description: 'Aksesoris handphone seperti case, charger, earphone, kabel data, dll',
  },
  {
    name: 'Minuman',
    description: 'Minuman ringan, air mineral, kopi, teh, jus, dll',
  },
  {
    name: 'Makanan Ringan',
    description: 'Snack, keripik, coklat, permen, biskuit, dll',
  },
  {
    name: 'Rokok',
    description: 'Rokok berbagai merk',
  },
  {
    name: 'Alat Tulis & Kantor',
    description: 'Pena, pensil, buku tulis, kertas, map, dan perlengkapan kantor',
  },
  {
    name: 'Kebutuhan Rumah Tangga',
    description: 'Sabun, deterjen, tisu, kantong plastik, dan kebutuhan harian',
  },
  {
    name: 'Perawatan Diri',
    description: 'Shampoo, sabun mandi, pasta gigi, deodorant, dll',
  },
  {
    name: 'Obat & Kesehatan',
    description: 'Obat-obatan bebas, vitamin, plester, masker, dan kebutuhan kesehatan',
  },
  {
    name: 'Elektronik & Gadget',
    description: 'Earphone, powerbank, mouse, flashdisk, dan aksesoris elektronik',
  },
];

export async function seedCategories(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);

  for (const data of CATEGORIES_DATA) {
    const existing = await prisma.posProductCategory.findFirst({
      where: {
        companyUuid,
        name: data.name,
      },
    });

    if (existing) {
      await prisma.posProductCategory.update({
        where: { uuid: existing.uuid },
        data,
      });
    } else {
      await prisma.posProductCategory.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          ...data,
        },
      });
    }
  }

  console.log(`✓ ${CATEGORIES_DATA.length} categories dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedCategories(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
