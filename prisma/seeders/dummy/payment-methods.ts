/**
 * Dummy seeder untuk payment methods (metode pembayaran).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/payment-methods.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

const PAYMENT_METHODS_DATA = [
  {
    code: 'CASH',
    name: 'Tunai',
    type: 'cash',
    description: 'Pembayaran tunai',
    isActive: true,
  },
  {
    code: 'BCA',
    name: 'Transfer BCA',
    type: 'bank_transfer',
    accountNumber: '1234567890',
    accountName: 'PT Konter App',
    description: 'Transfer bank BCA',
    isActive: true,
  },
  {
    code: 'MANDIRI',
    name: 'Transfer Mandiri',
    type: 'bank_transfer',
    accountNumber: '9876543210',
    accountName: 'PT Konter App',
    description: 'Transfer bank Mandiri',
    isActive: true,
  },
  {
    code: 'QRIS',
    name: 'QRIS',
    type: 'qris',
    description: 'Pembayaran via QRIS',
    isActive: true,
  },
  {
    code: 'GOPAY',
    name: 'GoPay',
    type: 'e_wallet',
    accountNumber: '081234567890',
    accountName: 'PT Konter App',
    description: 'E-wallet GoPay',
    isActive: true,
  },
  {
    code: 'OVO',
    name: 'OVO',
    type: 'e_wallet',
    accountNumber: '081234567891',
    accountName: 'PT Konter App',
    description: 'E-wallet OVO',
    isActive: true,
  },
];

export async function seedPaymentMethods(prisma: PrismaClient) {
  for (const data of PAYMENT_METHODS_DATA) {
    await prisma.posPaymentMethod.upsert({
      where: { code: data.code },
      update: data,
      create: {
        uuid: uuidv7(),
        ...data,
      },
    });
  }

  console.log(`✓ ${PAYMENT_METHODS_DATA.length} payment methods dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedPaymentMethods(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
