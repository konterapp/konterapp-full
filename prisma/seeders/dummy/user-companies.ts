/**
 * Dummy seeder untuk demonstrasi 1 user terhubung ke >1 perusahaan
 * (tabel company_users mendukung many-to-many antara User & Company).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/user-companies.ts
 *
 * Butuh user & companies sudah ada (seedCore + seedCompanies).
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { DEFAULT_USER_EMAIL } from "../users";
import { TENANT_DEFAULT_ROLE_ADMINISTRATOR } from "../../../lib/modules/roles/templates";

const EXTRA_MEMBERSHIPS = [
  { userEmail: DEFAULT_USER_EMAIL, companyCode: "CMP-002" },
];

export async function seedUserCompanies(prisma: PrismaClient) {
  let count = 0;

  for (const membership of EXTRA_MEMBERSHIPS) {
    const [user, company] = await Promise.all([
      prisma.user.findUnique({ where: { email: membership.userEmail } }),
      prisma.company.findUnique({ where: { code: membership.companyCode } }),
    ]);

    if (!user || !company) continue;

    await prisma.companyUser.upsert({
      where: {
        company_user_unique: {
          companyUuid: company.uuid,
          userId: user.id,
        },
      },
      update: { isActive: true, invitationAcceptedAt: new Date() },
      create: {
        uuid: uuidv7(),
        companyUuid: company.uuid,
        userId: user.id,
        isDefault: false,
        isActive: true,
        invitationAcceptedAt: new Date(),
      },
    });

    // User dapat role administrator di company tambahan ini (role milik company
    // tsb) -- company dummy ini tidak punya user lain, jadi harus ada admin
    // supaya tidak jadi company tanpa administrator sama sekali. Role lama
    // (kalau seeder pernah dijalankan sebelum role di sini diganti) dihapus
    // dulu supaya user tidak berakhir punya 2 role sekaligus di company ini.
    await prisma.modelHasRole.deleteMany({
      where: { modelId: user.id, modelType: "App\\Models\\User", companyUuid: company.uuid },
    });
    const role = await prisma.role.findFirst({
      where: { companyUuid: company.uuid, name: TENANT_DEFAULT_ROLE_ADMINISTRATOR },
      select: { id: true },
    });
    if (role) {
      await prisma.modelHasRole.create({
        data: {
          roleId: role.id,
          modelType: "App\\Models\\User",
          modelId: user.id,
          companyUuid: company.uuid,
        },
      });
    }

    count += 1;
  }

  console.log(`✓ ${count} user-company memberships tambahan dummy created/updated`);
}
