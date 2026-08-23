/**
 * Dummy seeder untuk transaksi PPOB.
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/ppob-transactions.ts
 */
import { PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { getDefaultCompanyUuid } from '../company';
import { DEFAULT_ADMIN_EMAIL } from '../users';

const TRANSACTIONS_DATA = [
  {
    transactionNumber: 'PPOB-20260320-001',
    type: 'prepaid',
    productCode: 'DF-PULSA-10K',
    productName: 'Pulsa Telkomsel 10.000',
    customerNumber: '081234567890',
    amount: 10000,
    adminFee: 1500,
    sellingPrice: 11500,
    profit: 800,
    provider: 'digiflazz',
    status: 'success',
    providerReference: 'DF-REF-001',
    notes: 'Dummy success transaksi PPOB',
  },
  {
    transactionNumber: 'PPOB-20260320-002',
    type: 'prepaid',
    productCode: 'RB-DATA-5GB',
    productName: 'Paket Data 5GB',
    customerNumber: '081298765432',
    amount: 32000,
    adminFee: 2000,
    sellingPrice: 35000,
    profit: 1200,
    provider: 'rajabiller',
    status: 'pending',
    providerReference: null,
    notes: 'Dummy pending transaksi PPOB',
  },
  {
    transactionNumber: 'PPOB-20260320-003',
    type: 'postpaid',
    productCode: 'DF-PLN-PASCA',
    productName: 'PLN Pascabayar',
    customerNumber: '543210987654',
    amount: 250000,
    adminFee: 3000,
    sellingPrice: 253000,
    profit: 1500,
    provider: 'digiflazz',
    status: 'failed',
    providerReference: 'DF-REF-003',
    notes: 'Dummy failed transaksi PPOB',
  },
];

async function ensureAdmin(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({ where: { email: DEFAULT_ADMIN_EMAIL } });
  if (!admin) {
    console.log('⚠ Admin user not found, skipping ppob transactions seed');
    return null;
  }
  return admin;
}

async function ensureBranch(prisma: PrismaClient, companyUuid: string) {
  const existing = await prisma.appPosBranch.findFirst({ where: { companyUuid }, orderBy: { createdAt: 'asc' } });
  if (existing) return existing;

  return prisma.appPosBranch.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      code: 'CB001',
      name: 'Konter Pusat',
      address: 'Jl. Margonda Raya No. 1',
      phone: '021-1234567',
      email: 'pusat@konterapp.com',
      isActive: true,
      isMain: true,
    },
  });
}

async function ensureSaldoAccount(prisma: PrismaClient, companyUuid: string) {
  const existing = await prisma.appPosSaldoAccount.findFirst({
    where: { companyUuid, code: 'CASH' },
  });
  if (existing) return existing;

  return prisma.appPosSaldoAccount.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      code: 'CASH',
      name: 'Tunai',
      type: 'cash',
      description: 'Pembayaran tunai',
      isPaymentMethod: true,
      isActive: true,
    },
  });
}

export async function seedPpobTransactions(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdmin(prisma);
  if (!admin) return;

  const branch = await ensureBranch(prisma, companyUuid);
  const saldoAccount = await ensureSaldoAccount(prisma, companyUuid);

  for (const item of TRANSACTIONS_DATA) {
    await prisma.appPosPpobTransaction.upsert({
      where: { transactionNumber: item.transactionNumber },
      update: {
        companyUuid,
        branchUuid: branch.uuid,
        type: item.type,
        productCode: item.productCode,
        productName: item.productName,
        customerNumber: item.customerNumber,
        amount: item.amount,
        adminFee: item.adminFee,
        sellingPrice: item.sellingPrice,
        profit: item.profit,
        paymentMethodUuid: saldoAccount.uuid,
        providerReference: item.providerReference,
        provider: item.provider,
        status: item.status,
        providerResponse: {
          status: item.status.toUpperCase(),
          message: item.notes,
        },
        notes: item.notes,
        createdBy: admin.id,
      },
      create: {
        uuid: uuidv7(),
        companyUuid,
        branchUuid: branch.uuid,
        transactionNumber: item.transactionNumber,
        type: item.type,
        productCode: item.productCode,
        productName: item.productName,
        customerNumber: item.customerNumber,
        amount: item.amount,
        adminFee: item.adminFee,
        sellingPrice: item.sellingPrice,
        profit: item.profit,
        paymentMethodUuid: saldoAccount.uuid,
        providerReference: item.providerReference,
        provider: item.provider,
        status: item.status,
        providerResponse: {
          status: item.status.toUpperCase(),
          message: item.notes,
        },
        notes: item.notes,
        createdBy: admin.id,
      },
    });
  }

  console.log(`✓ ${TRANSACTIONS_DATA.length} ppob transactions dummy created`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedPpobTransactions(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
