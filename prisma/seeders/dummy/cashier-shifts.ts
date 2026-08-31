/**
 * Dummy seeder untuk shift kasir POS.
 * Jalankan: npm run seed:dummy:file prisma/seeders/dummy/cashier-shifts.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_ADMIN_EMAIL } from "../users";
import { dateAtTimeDaysAgo } from "./date-helpers";

type ClosedShiftSeed = {
  marker: string;
  openedAt: Date;
  closedAt: Date;
  totalSales: number;
  notesClose: string;
};

// Tanggal RELATIF ke saat seeder dijalankan (bukan statis) -- marker tetap
// stabil (dipakai sbg kunci dedup), cuma tanggalnya yg dinamis.
const CLOSED_SHIFTS: ClosedShiftSeed[] = [
  {
    marker: "dummy-shift-pagi-1",
    openedAt: dateAtTimeDaysAgo(4, "08:00:00"),
    closedAt: dateAtTimeDaysAgo(4, "16:00:00"),
    totalSales: 1350000,
    notesClose: "Shift pagi selesai normal.",
  },
  {
    marker: "dummy-shift-pagi-2",
    openedAt: dateAtTimeDaysAgo(3, "08:00:00"),
    closedAt: dateAtTimeDaysAgo(3, "16:00:00"),
    totalSales: 1180000,
    notesClose: "Shift pagi selesai normal.",
  },
];

const OPEN_SHIFT = {
  marker: "dummy-shift-open-terkini",
  openedAt: dateAtTimeDaysAgo(0, "08:00:00"),
  notesOpen: "Shift aktif dummy untuk uji fitur tutup shift.",
};

async function ensureAdminUser(prisma: PrismaClient) {
  return prisma.user.findFirst({
    where: { email: DEFAULT_ADMIN_EMAIL },
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
          totalSales: seed.totalSales,
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
        totalSales: seed.totalSales,
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
        totalSales: 0,
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
