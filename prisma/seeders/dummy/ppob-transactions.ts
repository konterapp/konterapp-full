/**
 * Dummy seeder untuk fitur Server Pulsa/PPOB -- beberapa contoh Jenis
 * Transaksi (master data dinamis, BEDA dari Agen Bank yang hardcode) dan
 * transaksi. Meniru pola mutasi kas + sale sintetis laba persis seperti
 * logic service asli (lihat lib/modules/pos/ppob-transactions/admin.service.ts):
 * - Akun Server PPOB (OrderKuota): bergerak sebesar base_amount (modal)
 *   sesuai cash_direction jenis transaksinya.
 * - Akun metode bayar (Cash): bergerak sebesar uang tunai yg fisik
 *   diterima/diserahkan kasir (terpisah dari pergerakan akun server).
 * - Laba (selling_amount - base_amount, GROSS -- belum dikurangi admin_fee)
 *   dicatat sbg 1 baris app_pos_sale sintetis ke produk sistem "Laba PPOB".
 * Jalankan: npm run seed:dummy:file prisma/seeders/dummy/ppob-transactions.ts
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_ADMIN_EMAIL } from "../users";

const PROFIT_PRODUCT_NAME = "Laba PPOB";
const PROFIT_CATEGORY_NAME = "Sistem";

const TRANSACTION_TYPES_DATA: Array<{ name: string; cashDirection: "in" | "out"; sortOrder: number }> = [
  { name: "Pulsa", cashDirection: "out", sortOrder: 0 },
  { name: "Paket Data", cashDirection: "out", sortOrder: 1 },
  { name: "Token PLN", cashDirection: "out", sortOrder: 2 },
  { name: "Top Up DANA", cashDirection: "out", sortOrder: 3 },
  { name: "Top Up OVO", cashDirection: "out", sortOrder: 4 },
  { name: "Top Up ShopeePay", cashDirection: "out", sortOrder: 5 },
  { name: "Top Up Game", cashDirection: "out", sortOrder: 6 },
  { name: "Bayar BPJS", cashDirection: "out", sortOrder: 7 },
  { name: "Bayar PLN", cashDirection: "out", sortOrder: 8 },
  { name: "Bayar PDAM", cashDirection: "out", sortOrder: 9 },
  { name: "Lainnya", cashDirection: "out", sortOrder: 10 },
];

async function ensureAdmin(prisma: PrismaClient) {
  return prisma.user.findFirst({ where: { email: DEFAULT_ADMIN_EMAIL } });
}

async function ensureProfitProduct(prisma: PrismaClient | Prisma.TransactionClient, companyUuid: string) {
  const sku = `SYS-LABA-PPOB-${companyUuid}`;
  const existing = await prisma.appPosProduct.findUnique({ where: { sku } });
  if (existing) return existing;

  let category = await prisma.appPosProductCategory.findFirst({
    where: { companyUuid, name: PROFIT_CATEGORY_NAME },
  });
  if (!category) {
    category = await prisma.appPosProductCategory.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        name: PROFIT_CATEGORY_NAME,
        description: "Kategori internal untuk produk yang dibuat otomatis oleh sistem -- jangan dihapus.",
      },
    });
  }

  return prisma.appPosProduct.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      categoryUuid: category.uuid,
      name: PROFIT_PRODUCT_NAME,
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

export async function seedPpobTransactions(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdmin(prisma);
  if (!admin) {
    console.log("⚠ Admin user not found, skipping ppob transactions seed");
    return;
  }

  const branch = await prisma.appPosBranch.findFirst({ where: { companyUuid, code: "CB001" } });
  if (!branch) {
    console.log("⚠ Cabang CB001 tidak ditemukan, skipping ppob transactions seed");
    return;
  }

  // (1) Jenis Transaksi -- idempoten, find-or-create per nama.
  const typesByName = new Map<string, { uuid: string; cashDirection: string }>();
  for (const data of TRANSACTION_TYPES_DATA) {
    const existing = await prisma.appPosPpobTransactionType.findFirst({
      where: { companyUuid, name: data.name },
    });
    const type =
      existing ??
      (await prisma.appPosPpobTransactionType.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          name: data.name,
          cashDirection: data.cashDirection,
          isActive: true,
          sortOrder: data.sortOrder,
        },
      }));
    typesByName.set(data.name, { uuid: type.uuid, cashDirection: type.cashDirection });
  }
  console.log(`✓ ${TRANSACTION_TYPES_DATA.length} jenis transaksi PPOB dummy dipastikan ada`);

  const existingCount = await prisma.appPosPpobTransaction.count({ where: { companyUuid } });
  if (existingCount > 0) {
    console.log("✓ 0 ppob transactions dummy created (sudah ada)");
    return;
  }

  // Reuse akun OrderKuota (Server PPOB) dan CASH (metode bayar) yang sudah
  // ada -- BUKAN akun terpisah, sesuai desain "akun apa pun bisa dipakai".
  const serverAccount = await prisma.appPosSaldoAccount.findUnique({
    where: { companyUuid_code: { companyUuid, code: "ORDERKUOTA" } },
  });
  const cashAccount = await prisma.appPosSaldoAccount.findUnique({
    where: { companyUuid_code: { companyUuid, code: "CASH" } },
  });
  if (!serverAccount || !cashAccount) {
    console.log("⚠ Akun ORDERKUOTA/CASH tidak ditemukan, skipping ppob transactions seed");
    return;
  }

  const serverBranchLink = await prisma.appPosSaldoAccountBalanceBranch.findFirst({
    where: { saldoAccountUuid: serverAccount.uuid, branchUuid: branch.uuid },
  });
  const cashBranchLink = await prisma.appPosSaldoAccountBalanceBranch.findFirst({
    where: { saldoAccountUuid: cashAccount.uuid, branchUuid: branch.uuid },
  });
  if (!serverBranchLink || !cashBranchLink) {
    console.log("⚠ Grup balance ORDERKUOTA/CASH untuk CB001 tidak ditemukan, skipping ppob transactions seed");
    return;
  }

  const samples: Array<{
    number: string;
    typeName: string;
    accountReference: string;
    baseAmount: number;
    sellingAmount: number;
    adminFee: number;
    paidAmount: number;
  }> = [
    {
      number: "PPOB-DUMMY-001",
      typeName: "Pulsa",
      accountReference: "081234567890",
      baseAmount: 9500,
      sellingAmount: 11000,
      adminFee: 0,
      paidAmount: 11000,
    },
    {
      number: "PPOB-DUMMY-002",
      typeName: "Token PLN",
      accountReference: "5312890123456",
      baseAmount: 50000,
      sellingAmount: 52500,
      // Contoh biaya admin server > 0 -- demonstrasi Laba Bersih bisa lebih
      // kecil dari laba kotor (2.500), bukan cuma kasus adminFee=0.
      adminFee: 1000,
      paidAmount: 52500,
    },
  ];

  let createdCount = 0;
  for (const sample of samples) {
    const type = typesByName.get(sample.typeName);
    if (!type) continue;

    await prisma.$transaction(async (tx) => {
      const changeAmount = Math.max(sample.paidAmount - sample.sellingAmount, 0);

      const transaction = await tx.appPosPpobTransaction.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          branchUuid: branch.uuid,
          saldoAccountUuid: serverAccount.uuid,
          saldoAccountBalanceUuid: serverBranchLink.saldoAccountBalanceUuid,
          transactionTypeUuid: type.uuid,
          transactionNumber: sample.number,
          cashDirection: type.cashDirection,
          accountReference: sample.accountReference,
          baseAmount: sample.baseAmount,
          sellingAmount: sample.sellingAmount,
          adminFee: sample.adminFee,
          paymentMethodUuid: cashAccount.uuid,
          paidAmount: sample.paidAmount,
          changeAmount,
          notes: "Contoh transaksi dummy",
          createdBy: admin.id,
        },
      });

      // (1) Nominal modal -- akun Server PPOB (OrderKuota).
      const serverBefore = await tx.appPosSaldoAccountBalance.findUniqueOrThrow({
        where: { uuid: serverBranchLink.saldoAccountBalanceUuid },
        select: { balance: true },
      });
      const serverAfter =
        type.cashDirection === "in"
          ? Number(serverBefore.balance) + sample.baseAmount
          : Number(serverBefore.balance) - sample.baseAmount;
      await tx.appPosSaldoAccountBalance.update({
        where: { uuid: serverBranchLink.saldoAccountBalanceUuid },
        data: { balance: serverAfter },
      });
      await tx.appPosSaldoMutation.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          saldoAccountBalanceUuid: serverBranchLink.saldoAccountBalanceUuid,
          branchUuid: branch.uuid,
          direction: type.cashDirection,
          amount: sample.baseAmount,
          balanceBefore: serverBefore.balance,
          balanceAfter: serverAfter,
          referenceType: "ppob_transaction",
          referenceUuid: transaction.uuid,
          notes: `${sample.typeName} (${transaction.transactionNumber})`,
          createdBy: admin.id,
        },
      });

      // (2) Uang fisik yg diterima kasir -- akun metode bayar (Cash).
      const netCashIn = sample.paidAmount - changeAmount;
      if (netCashIn > 0) {
        const cashBefore = await tx.appPosSaldoAccountBalance.findUniqueOrThrow({
          where: { uuid: cashBranchLink.saldoAccountBalanceUuid },
          select: { balance: true },
        });
        const cashAfter = Number(cashBefore.balance) + netCashIn;
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
            direction: "in",
            amount: netCashIn,
            balanceBefore: cashBefore.balance,
            balanceAfter: cashAfter,
            referenceType: "ppob_transaction",
            referenceUuid: transaction.uuid,
            notes: `${sample.typeName} (${transaction.transactionNumber})`,
            createdBy: admin.id,
          },
        });
      }

      // (3) SELALU baris sale sintetis, nominalnya LABA KOTOR (jual - modal).
      {
        const grossProfit = sample.sellingAmount - sample.baseAmount;
        const profitProduct = await ensureProfitProduct(tx, companyUuid);
        const sale = await tx.appPosSale.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            saleNumber: `LBP-${transaction.transactionNumber}`,
            branchUuid: branch.uuid,
            paymentMethodUuid: cashAccount.uuid,
            ppobTransactionUuid: transaction.uuid,
            saleDate: new Date(),
            subtotal: grossProfit,
            discountAmount: 0,
            totalAmount: grossProfit,
            paidAmount: grossProfit,
            changeAmount: 0,
            paymentStatus: "paid",
            notes: `Laba ${sample.typeName} (${transaction.transactionNumber})`,
            createdBy: admin.id,
          },
        });
        await tx.appPosSaleItem.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            saleUuid: sale.uuid,
            productUuid: profitProduct.uuid,
            quantity: 1,
            unitPrice: grossProfit,
            discount: 0,
            subtotal: grossProfit,
          },
        });
      }
    });

    createdCount += 1;
  }

  console.log(`✓ ${createdCount} ppob transactions dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedPpobTransactions(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
