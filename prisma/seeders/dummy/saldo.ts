/**
 * Dummy seeder untuk akun saldo (Cash, Dana, Gopay, BRI, dst).
 * Jalankan: npm run seed:dummy:file prisma/seeders/dummy/saldo.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_ADMIN_EMAIL } from "../users";

const SALDO_ACCOUNTS_DATA = [
  {
    code: "CASH",
    name: "Tunai",
    type: "cash",
    description: "Uang tunai di laci kasir",
    isPaymentMethod: true,
    openingBalance: 500000,
  },
  {
    code: "BCA",
    name: "Transfer BCA",
    type: "bank",
    accountNumber: "1234567890",
    accountName: "PT Konter App",
    description: "Rekening bank BCA",
    isPaymentMethod: true,
    openingBalance: 3000000,
  },
  {
    code: "DANA",
    name: "Dana",
    type: "e_wallet",
    accountNumber: "081234567890",
    accountName: "PT Konter App",
    description: "Saldo aplikasi Dana",
    isPaymentMethod: true,
    openingBalance: 750000,
  },
  {
    code: "GOPAY",
    name: "GoPay",
    type: "e_wallet",
    accountNumber: "081234567891",
    accountName: "PT Konter App",
    description: "Saldo aplikasi GoPay",
    isPaymentMethod: true,
    openingBalance: 250000,
  },
  {
    code: "ORDERKUOTA",
    name: "OrderKuota",
    type: "other",
    description: "Saldo deposit provider PPOB (bukan metode bayar customer)",
    isPaymentMethod: false,
    openingBalance: 1000000,
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
          balance: data.openingBalance,
          isActive: true,
        },
      });

      await tx.appPosSaldoMutation.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          saldoAccountUuid: account.uuid,
          direction: "in",
          amount: data.openingBalance,
          balanceBefore: 0,
          balanceAfter: data.openingBalance,
          referenceType: "opening_balance",
          notes: "Saldo awal (dummy)",
          createdBy: admin.id,
        },
      });
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
