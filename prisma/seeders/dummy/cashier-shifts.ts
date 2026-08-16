/**
 * Dummy seeder untuk shift kasir POS.
 * Jalankan: npm run seed:dummy:file prisma/seeders/dummy/cashier-shifts.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";

type ClosedShiftSeed = {
  marker: string;
  openedAt: Date;
  closedAt: Date;
  openingCash: number;
  totalSales: number;
  closingCash: number;
  notesClose: string;
};

const CLOSED_SHIFTS: ClosedShiftSeed[] = [
  {
    marker: "dummy-shift-2026-04-15-pagi",
    openedAt: new Date("2026-04-15T08:00:00+07:00"),
    closedAt: new Date("2026-04-15T16:00:00+07:00"),
    openingCash: 500000,
    totalSales: 1350000,
    closingCash: 1860000,
    notesClose: "Selisih +10.000 dari pembulatan transaksi tunai.",
  },
  {
    marker: "dummy-shift-2026-04-16-pagi",
    openedAt: new Date("2026-04-16T08:00:00+07:00"),
    closedAt: new Date("2026-04-16T16:00:00+07:00"),
    openingCash: 450000,
    totalSales: 1180000,
    closingCash: 1620000,
    notesClose: "Selisih -10.000, sudah dicatat di kas kecil.",
  },
];

const OPEN_SHIFT = {
  marker: "dummy-shift-open-2026-04-19",
  openedAt: new Date("2026-04-19T08:00:00+07:00"),
  openingCash: 550000,
  notesOpen: "Shift aktif dummy untuk uji fitur tutup shift.",
};

async function ensureAdminUser(prisma: PrismaClient) {
  return prisma.user.findFirst({
    where: { email: "admin@admin.com" },
  });
}

async function ensureBranch(prisma: PrismaClient, companyUuid: string) {
  const existing = await prisma.appPosBranch.findFirst({
    where: { companyUuid, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  return prisma.appPosBranch.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      code: "CB001",
      name: "Cabang Pusat",
      address: "Jl. Raya Utama No. 123, Jakarta Pusat",
      phone: "021-12345678",
      email: "pusat@konterapp.com",
      isMain: true,
      isActive: true,
    },
  });
}

export async function seedCashierShifts(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdminUser(prisma);
  if (!admin) {
    console.log("⚠ Admin user not found, skipping cashier shifts seed");
    return;
  }

  const branch = await ensureBranch(prisma, companyUuid);
  let createdOrUpdated = 0;

  for (const seed of CLOSED_SHIFTS) {
    const expectedCash = seed.openingCash + seed.totalSales;
    const variance = seed.closingCash - expectedCash;

    const existing = await prisma.appPosCashierShift.findFirst({
      where: {
        companyUuid,
        userId: admin.id,
        notesOpen: seed.marker,
      },
    });

    if (existing) {
      await prisma.appPosCashierShift.update({
        where: { uuid: existing.uuid },
        data: {
          branchUuid: branch.uuid,
          status: "closed",
          openedAt: seed.openedAt,
          closedAt: seed.closedAt,
          openingCash: seed.openingCash,
          totalSales: seed.totalSales,
          expectedCash,
          closingCash: seed.closingCash,
          variance,
          notesClose: seed.notesClose,
        },
      });
      createdOrUpdated += 1;
      continue;
    }

    await prisma.appPosCashierShift.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        branchUuid: branch.uuid,
        userId: admin.id,
        status: "closed",
        openedAt: seed.openedAt,
        closedAt: seed.closedAt,
        openingCash: seed.openingCash,
        totalSales: seed.totalSales,
        expectedCash,
        closingCash: seed.closingCash,
        variance,
        notesOpen: seed.marker,
        notesClose: seed.notesClose,
      },
    });
    createdOrUpdated += 1;
  }

  const existingOpen = await prisma.appPosCashierShift.findFirst({
    where: {
      companyUuid,
      userId: admin.id,
      status: "open",
    },
  });

  if (!existingOpen) {
    await prisma.appPosCashierShift.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        branchUuid: branch.uuid,
        userId: admin.id,
        status: "open",
        openedAt: OPEN_SHIFT.openedAt,
        openingCash: OPEN_SHIFT.openingCash,
        totalSales: 0,
        expectedCash: OPEN_SHIFT.openingCash,
        variance: 0,
        notesOpen: OPEN_SHIFT.notesOpen,
      },
    });
    createdOrUpdated += 1;
  }

  console.log(`✓ ${createdOrUpdated} cashier shifts dummy created/updated`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedCashierShifts(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
