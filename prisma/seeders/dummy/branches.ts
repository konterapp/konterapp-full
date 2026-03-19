/**
 * Dummy seeder untuk branches (cabang).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/branches.ts
 */
import { PrismaClient } from "@prisma/client";

const BRANCHES_DATA = [
  {
    code: 'CB001',
    name: 'Cabang Pusat',
    address: 'Jl. Raya Utama No. 123, Jakarta Pusat',
    phone: '021-12345678',
    email: 'pusat@konterapp.com',
    isMain: true,
    isActive: true,
  },
  {
    code: 'CB002',
    name: 'Cabang Bandung',
    address: 'Jl. Asia Afrika No. 456, Bandung',
    phone: '022-87654321',
    email: 'bandung@konterapp.com',
    isMain: false,
    isActive: true,
  },
  {
    code: 'CB003',
    name: 'Cabang Surabaya',
    address: 'Jl. Tunjungan No. 789, Surabaya',
    phone: '031-98765432',
    email: 'surabaya@konterapp.com',
    isMain: false,
    isActive: true,
  },
];

export async function seedBranches(prisma: PrismaClient) {
  for (const data of BRANCHES_DATA) {
    await prisma.posBranch.upsert({
      where: { code: data.code },
      update: data,
      create: data,
    });
  }

  console.log(`✓ ${BRANCHES_DATA.length} branches dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedBranches(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
