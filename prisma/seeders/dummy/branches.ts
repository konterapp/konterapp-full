/**
 * Dummy seeder untuk branches (cabang).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/branches.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_USER_EMAIL } from "../users";

const BRANCHES_DATA = [
  {
    code: 'CB001',
    name: 'Cabang Pusat',
    address: 'Jl. Raya Utama No. 123, Jakarta Pusat',
    phone: '021-12345678',
    email: 'pusat@konterapp.com',
    isMain: true,
    isActive: true,
    maxConcurrentUsers: 2,
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
  const companyUuid = await getDefaultCompanyUuid(prisma);

  const branchByCode = new Map<string, { uuid: string }>();
  for (const data of BRANCHES_DATA) {
    const branch = await prisma.appPosBranch.upsert({
      where: { companyUuid_code: { companyUuid, code: data.code } },
      update: {
        ...data,
        companyUuid,
      },
      create: {
        uuid: uuidv7(),
        companyUuid,
        ...data,
      },
    });
    branchByCode.set(data.code, branch);
  }

  console.log(`✓ ${BRANCHES_DATA.length} branches dummy created`);

  // Role Kasir sengaja TIDAK punya pos.branch.index, jadi di alur nyata
  // (lib/modules/users/app.admin.service.ts::resolveBranchSelection) admin
  // WAJIB pilih minimal 1 cabang saat bikin/edit user dengan role ini --
  // assignment kosong cuma boleh buat role yang punya pos.branch.index
  // (dianggap "kelola semua cabang", makanya tidak perlu dibatasi).
  // Kasir dummy dibuat lewat seeder (bypass validasi form itu), jadi perlu
  // di-assign manual di sini juga supaya konsisten dengan constraint yang
  // sama -- tanpa ini dia "kelihatan" tidak dibatasi padahal seharusnya
  // cuma 1 cabang seperti kasir sungguhan.
  const kasirUser = await prisma.user.findFirst({ where: { email: DEFAULT_USER_EMAIL } });
  const mainBranch = branchByCode.get("CB001");
  if (kasirUser && mainBranch) {
    const companyUser = await prisma.companyUser.findFirst({
      where: { companyUuid, userId: kasirUser.id },
    });
    if (companyUser) {
      await prisma.companyUserBranch.upsert({
        where: {
          company_user_branch_unique: {
            companyUserUuid: companyUser.uuid,
            branchUuid: mainBranch.uuid,
          },
        },
        update: {},
        create: {
          uuid: uuidv7(),
          companyUuid,
          companyUserUuid: companyUser.uuid,
          branchUuid: mainBranch.uuid,
        },
      });
      console.log("✓ Kasir dummy di-assign ke cabang CB001");
    }
  }
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
