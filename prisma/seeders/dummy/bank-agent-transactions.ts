/**
 * Dummy seeder untuk fitur Agen Bank -- beberapa contoh transaksi (jenis
 * transaksi hardcode, lihat BANK_AGENT_TRANSACTION_TYPES di
 * lib/modules/pos/bank-agent-transactions/admin.service.ts). Meniru pola
 * mutasi kas + sale sintetis komisi persis seperti logic service asli:
 * - Akun Agen Bank (BRI): bergerak sebesar base_amount sesuai cash_direction.
 * - Akun metode bayar (Cash): bergerak sebesar uang tunai yg fisik
 *   diterima/diserahkan kasir (terpisah dari pergerakan akun Agen Bank).
 * - Kalau ada komisi (fee > 0): dicatat sbg 1 baris app_pos_sale sintetis ke
 *   produk sistem "Komisi Agen Bank", supaya Riwayat/laporan omzet cukup
 *   baca app_pos_sales tanpa perlu gabung banyak sumber data.
 * Jalankan: npm run seed:dummy:file prisma/seeders/dummy/bank-agent-transactions.ts
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_ADMIN_EMAIL } from "../users";

const COMMISSION_PRODUCT_NAME = "Komisi Agen Bank";
const COMMISSION_CATEGORY_NAME = "Sistem";

async function ensureAdmin(prisma: PrismaClient) {
  return prisma.user.findFirst({ where: { email: DEFAULT_ADMIN_EMAIL } });
}

async function ensureCommissionProduct(prisma: PrismaClient | Prisma.TransactionClient, companyUuid: string) {
  const sku = `SYS-KOMISI-AGEN-BANK-${companyUuid}`;
  const existing = await prisma.appPosProduct.findUnique({ where: { sku } });
  if (existing) return existing;

  let category = await prisma.appPosProductCategory.findFirst({
    where: { companyUuid, name: COMMISSION_CATEGORY_NAME },
  });
  if (!category) {
    category = await prisma.appPosProductCategory.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        name: COMMISSION_CATEGORY_NAME,
        description: "Kategori internal untuk produk yang dibuat otomatis oleh sistem -- jangan dihapus.",
      },
    });
  }

  return prisma.appPosProduct.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      categoryUuid: category.uuid,
      name: COMMISSION_PRODUCT_NAME,
      sku,
      purchasePrice: 0,
      sellingPrice: 0,
      wholesalePrice: 0,
      minStock: 0,
      unit: "pcs",
      isActive: true,
      isSystem: true,
    },
  });
}

export async function seedBankAgentTransactions(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdmin(prisma);
  if (!admin) {
    console.log("⚠ Admin user not found, skipping bank agent transactions seed");
    return;
  }

  const branch = await prisma.appPosBranch.findFirst({ where: { companyUuid, code: "CB001" } });
  if (!branch) {
    console.log("⚠ Cabang CB001 tidak ditemukan, skipping bank agent transactions seed");
    return;
  }

  const existingCount = await prisma.appPosBankAgentTransaction.count({ where: { companyUuid } });
  if (existingCount > 0) {
    console.log("✓ 0 bank agent transactions dummy created (sudah ada)");
    return;
  }

  // Reuse akun BRI (Agen Bank) dan CASH (metode bayar) yang sudah ada --
  // BUKAN akun terpisah, sesuai desain "akun apa pun bisa dipakai".
  const bankAccount = await prisma.appPosSaldoAccount.findUnique({
    where: { companyUuid_code: { companyUuid, code: "BRI" } },
  });
  const cashAccount = await prisma.appPosSaldoAccount.findUnique({
    where: { companyUuid_code: { companyUuid, code: "CASH" } },
  });
  if (!bankAccount || !cashAccount) {
    console.log("⚠ Akun BRI/CASH tidak ditemukan, skipping bank agent transactions seed");
    return;
  }

  const bankBranchLink = await prisma.appPosSaldoAccountBalanceBranch.findFirst({
    where: { saldoAccountUuid: bankAccount.uuid, branchUuid: branch.uuid },
  });
  const cashBranchLink = await prisma.appPosSaldoAccountBalanceBranch.findFirst({
    where: { saldoAccountUuid: cashAccount.uuid, branchUuid: branch.uuid },
  });
  if (!bankBranchLink || !cashBranchLink) {
    console.log("⚠ Grup balance BRI/CASH untuk CB001 tidak ditemukan, skipping bank agent transactions seed");
    return;
  }

  type CashMutation = { direction: "in" | "out"; amount: number; notes: string };

  const samples: Array<{
    number: string;
    transactionType: "deposit" | "withdrawal";
    label: string;
    cashDirection: "in" | "out";
    baseAmount: number;
    fee: number;
    feeReceivedVia: string | null;
    sellingAmount: number;
    paidAmount: number;
    changeAmount: number;
    cashMutations: CashMutation[];
  }> = [
    {
      number: "BA-DUMMY-001",
      transactionType: "deposit",
      label: "Setor Tunai",
      cashDirection: "out",
      baseAmount: 500000,
      fee: 5000,
      feeReceivedVia: null,
      sellingAmount: 505000,
      paidAmount: 505000,
      changeAmount: 0,
      // Setor Tunai: customer bayar tunai penuh (nominal + komisi) -> kas masuk.
      cashMutations: [{ direction: "in", amount: 505000, notes: "Setor Tunai (BA-DUMMY-001)" }],
    },
    {
      number: "BA-DUMMY-002",
      transactionType: "withdrawal",
      label: "Tarik Tunai",
      cashDirection: "in",
      baseAmount: 300000,
      fee: 5000,
      feeReceivedVia: "deducted",
      sellingAmount: 305000,
      paidAmount: 305000,
      changeAmount: 0,
      // Tarik Tunai (dipotong dari tunai): kas keluar = nominal - komisi.
      cashMutations: [{ direction: "out", amount: 295000, notes: "Tarik Tunai (BA-DUMMY-002)" }],
    },
  ];

  let createdCount = 0;
  for (const sample of samples) {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.appPosBankAgentTransaction.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          branchUuid: branch.uuid,
          saldoAccountUuid: bankAccount.uuid,
          saldoAccountBalanceUuid: bankBranchLink.saldoAccountBalanceUuid,
          transactionNumber: sample.number,
          transactionType: sample.transactionType,
          cashDirection: sample.cashDirection,
          baseAmount: sample.baseAmount,
          sellingAmount: sample.sellingAmount,
          fee: sample.fee,
          adminFee: 0,
          feeReceivedVia: sample.feeReceivedVia,
          paymentMethodUuid: cashAccount.uuid,
          paidAmount: sample.paidAmount,
          changeAmount: sample.changeAmount,
          notes: "Contoh transaksi dummy",
          createdBy: admin.id,
        },
      });

      // (1) Nominal transaksi -- akun Agen Bank (BRI).
      const bankBefore = await tx.appPosSaldoAccountBalance.findUniqueOrThrow({
        where: { uuid: bankBranchLink.saldoAccountBalanceUuid },
        select: { balance: true },
      });
      const bankAfter =
        sample.cashDirection === "in"
          ? Number(bankBefore.balance) + sample.baseAmount
          : Number(bankBefore.balance) - sample.baseAmount;
      await tx.appPosSaldoAccountBalance.update({
        where: { uuid: bankBranchLink.saldoAccountBalanceUuid },
        data: { balance: bankAfter },
      });
      await tx.appPosSaldoMutation.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          saldoAccountBalanceUuid: bankBranchLink.saldoAccountBalanceUuid,
          branchUuid: branch.uuid,
          direction: sample.cashDirection,
          amount: sample.baseAmount,
          balanceBefore: bankBefore.balance,
          balanceAfter: bankAfter,
          referenceType: "bank_agent_transaction",
          referenceUuid: transaction.uuid,
          notes: `${sample.label} (${transaction.transactionNumber})`,
          createdBy: admin.id,
        },
      });

      // (2) Uang fisik yg diterima/diserahkan kasir -- akun metode bayar (Cash).
      for (const mutation of sample.cashMutations) {
        const cashBefore = await tx.appPosSaldoAccountBalance.findUniqueOrThrow({
          where: { uuid: cashBranchLink.saldoAccountBalanceUuid },
          select: { balance: true },
        });
        const cashAfter =
          mutation.direction === "in"
            ? Number(cashBefore.balance) + mutation.amount
            : Number(cashBefore.balance) - mutation.amount;
        await tx.appPosSaldoAccountBalance.update({
          where: { uuid: cashBranchLink.saldoAccountBalanceUuid },
          data: { balance: cashAfter },
        });
        await tx.appPosSaldoMutation.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            saldoAccountBalanceUuid: cashBranchLink.saldoAccountBalanceUuid,
            branchUuid: branch.uuid,
            direction: mutation.direction,
            amount: mutation.amount,
            balanceBefore: cashBefore.balance,
            balanceAfter: cashAfter,
            referenceType: "bank_agent_transaction",
            referenceUuid: transaction.uuid,
            notes: mutation.notes,
            createdBy: admin.id,
          },
        });
      }

      // (3) SELALU baris sale sintetis, walau fee = 0 -- supaya transaksi ini
      // tetap kelihatan di menu Penjualan/Riwayat (murni pengakuan omzet,
      // bukan mutasi kas kedua).
      {
        const commissionProduct = await ensureCommissionProduct(tx, companyUuid);
        const sale = await tx.appPosSale.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            saleNumber: `KOM-${transaction.transactionNumber}`,
            branchUuid: branch.uuid,
            paymentMethodUuid: cashAccount.uuid,
            bankAgentTransactionUuid: transaction.uuid,
            saleDate: new Date(),
            subtotal: sample.fee,
            discountAmount: 0,
            totalAmount: sample.fee,
            paidAmount: sample.fee,
            changeAmount: 0,
            paymentStatus: "paid",
            notes: sample.fee > 0 ? `Komisi ${sample.label} (${transaction.transactionNumber})` : `${sample.label} (${transaction.transactionNumber})`,
            createdBy: admin.id,
          },
        });
        await tx.appPosSaleItem.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            saleUuid: sale.uuid,
            productUuid: commissionProduct.uuid,
            quantity: 1,
            unitPrice: sample.fee,
            discount: 0,
            subtotal: sample.fee,
          },
        });
      }
    });

    createdCount += 1;
  }

  console.log(`✓ ${createdCount} bank agent transactions dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedBankAgentTransactions(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
