/**
 * Dummy seeder untuk akun saldo (Cash, Dana, Gopay, BRI, dst) dengan
 * konsep multi-cabang: 1 akun induk bisa punya beberapa grup balance,
 * tiap grup dipakai bareng oleh sekumpulan cabang tertentu.
 * Studi kasus: Cash terpisah per cabang, Dana di-share Pusat+Bandung
 * tapi terpisah di Surabaya, sisanya share semua cabang.
 * Jalankan: npm run seed:dummy:file prisma/seeders/dummy/saldo.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_ADMIN_EMAIL } from "../users";

interface BalanceGroupSeed {
  /** Kode cabang yang masuk grup ini (harus sudah di-seed oleh branches.ts). */
  branchCodes: string[];
  openingBalance: number;
}

interface SaldoAccountSeed {
  code: string;
  name: string;
  type: string;
  accountNumber?: string;
  accountName?: string;
  description: string;
  isPaymentMethod: boolean;
  groups: BalanceGroupSeed[];
}

const SALDO_ACCOUNTS_DATA: SaldoAccountSeed[] = [
  {
    code: "CASH",
    name: "Tunai",
    type: "cash",
    description: "Uang tunai di laci kasir (terpisah per cabang)",
    isPaymentMethod: true,
    groups: [
      { branchCodes: ["CB001"], openingBalance: 500000 },
      { branchCodes: ["CB002"], openingBalance: 400000 },
      { branchCodes: ["CB003"], openingBalance: 350000 },
    ],
  },
  {
    code: "BCA",
    name: "Transfer BCA",
    type: "bank",
    accountNumber: "1234567890",
    accountName: "PT Konter App",
    description: "Rekening bank BCA (dipakai bareng semua cabang)",
    isPaymentMethod: true,
    groups: [{ branchCodes: ["CB001", "CB002", "CB003"], openingBalance: 3000000 }],
  },
  {
    code: "DANA",
    name: "Dana",
    type: "e_wallet",
    accountNumber: "081234567890",
    accountName: "PT Konter App",
    description: "Saldo aplikasi Dana (share Pusat+Bandung, Surabaya terpisah)",
    isPaymentMethod: true,
    groups: [
      { branchCodes: ["CB001", "CB002"], openingBalance: 750000 },
      { branchCodes: ["CB003"], openingBalance: 200000 },
    ],
  },
  {
    code: "GOPAY",
    name: "GoPay",
    type: "e_wallet",
    accountNumber: "081234567891",
    accountName: "PT Konter App",
    description: "Saldo aplikasi GoPay",
    isPaymentMethod: true,
    groups: [{ branchCodes: ["CB001", "CB002", "CB003"], openingBalance: 250000 }],
  },
  {
    code: "ORDERKUOTA",
    name: "OrderKuota",
    type: "other",
    description: "Saldo deposit provider PPOB (bukan metode bayar customer)",
    isPaymentMethod: false,
    groups: [{ branchCodes: ["CB001"], openingBalance: 1000000 }],
  },
];

async function ensureAdmin(prisma: PrismaClient) {
  return prisma.user.findFirst({ where: { email: DEFAULT_ADMIN_EMAIL } });
}

export async function seedSaldoAccounts(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdmin(prisma);
  if (!admin) {
    console.log("⚠ Admin user not found, skipping saldo accounts seed");
    return;
  }

  const branches = await prisma.appPosBranch.findMany({
    where: { companyUuid },
    select: { uuid: true, code: true },
  });
  const branchByCode = new Map(branches.map((b) => [b.code, b]));

  let createdCount = 0;

  for (const data of SALDO_ACCOUNTS_DATA) {
    const existing = await prisma.appPosSaldoAccount.findUnique({
      where: { companyUuid_code: { companyUuid, code: data.code } },
    });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const account = await tx.appPosSaldoAccount.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          code: data.code,
          name: data.name,
          type: data.type,
          accountNumber: data.accountNumber ?? null,
          accountName: data.accountName ?? null,
          description: data.description,
          isPaymentMethod: data.isPaymentMethod,
          isActive: true,
        },
      });

      for (const group of data.groups) {
        const branchUuids = group.branchCodes
          .map((code) => branchByCode.get(code)?.uuid)
          .filter((uuid): uuid is string => Boolean(uuid));

        if (branchUuids.length === 0) continue;

        const balanceRow = await tx.appPosSaldoAccountBalance.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            saldoAccountUuid: account.uuid,
            balance: 0,
          },
        });

        for (const branchUuid of branchUuids) {
          await tx.appPosSaldoAccountBalanceBranch.create({
            data: {
              uuid: uuidv7(),
              companyUuid,
              saldoAccountUuid: account.uuid,
              saldoAccountBalanceUuid: balanceRow.uuid,
              branchUuid,
            },
          });
        }

        if (group.openingBalance > 0) {
          await tx.appPosSaldoMutation.create({
            data: {
              uuid: uuidv7(),
              companyUuid,
              saldoAccountBalanceUuid: balanceRow.uuid,
              direction: "in",
              amount: group.openingBalance,
              balanceBefore: 0,
              balanceAfter: group.openingBalance,
              referenceType: "opening_balance",
              notes: "Saldo awal (dummy)",
              createdBy: admin.id,
            },
          });

          await tx.appPosSaldoAccountBalance.update({
            where: { uuid: balanceRow.uuid },
            data: { balance: group.openingBalance },
          });
        }
      }
    });

    createdCount += 1;
  }

  console.log(`✓ ${createdCount} saldo accounts dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedSaldoAccounts(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
