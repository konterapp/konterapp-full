/**
 * Dummy seeder untuk stock transfers (transfer stok antar cabang).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/stock-transfers.ts
 *
 * Menulis langsung ke ledger app_pos_stock_movements (movementType
 * transfer_out di cabang asal + transfer_in di cabang tujuan, berbagi
 * referenceUuid yang sama) -- pola yang identik dengan yang dipakai
 * lib/modules/pos/stock-transfers/admin.service.ts. Butuh seedBranches() dan
 * seedProducts() sudah jalan lebih dulu (lihat index.ts): seedProducts()
 * menaruh SELURUH initial_stock di cabang utama (CB001) saja, jadi cabang
 * lain (CB002/CB003) mulai dari 0 -- pas dipakai sebagai tujuan transfer di
 * sini supaya hasilnya kelihatan nyata di halaman Transfer Stok.
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_ADMIN_EMAIL } from "../users";

const TRANSFERS_DATA = [
  {
    fromBranchCode: "CB001",
    toBranchCode: "CB002",
    notes: "Kirim stok minuman & snack ke Cabang Bandung",
    items: [
      { sku: "DRK-AQUA-600", quantity: 30 },
      { sku: "SNACK-CHT-SP", quantity: 20 },
    ],
  },
  {
    fromBranchCode: "CB001",
    toBranchCode: "CB003",
    notes: "Kirim aksesoris untuk stok awal Cabang Surabaya",
    items: [{ sku: "ACC-CHG-TYPEC", quantity: 10 }],
  },
];

async function ensureAdminUser(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({ where: { email: DEFAULT_ADMIN_EMAIL } });
  if (!admin) {
    console.log("⚠ Admin user not found, skipping stock transfers seed");
  }
  return admin;
}

export async function seedStockTransfers(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdminUser(prisma);
  if (!admin) return;

  // Seeder ini menulis langsung ke ledger, jadi tidak punya kunci unik alami
  // seperti purchaseNumber -- idempotensi dicek kasar per company, sama
  // seperti pola dummy bank-agent-transactions.ts.
  const existingCount = await prisma.appPosStockMovement.count({
    where: { companyUuid, referenceType: "stock_transfer" },
  });
  if (existingCount > 0) {
    console.log("✓ Stock transfers dummy sudah ada, dilewati");
    return;
  }

  let itemsCreated = 0;

  for (const transfer of TRANSFERS_DATA) {
    const [fromBranch, toBranch] = await Promise.all([
      prisma.appPosBranch.findFirst({ where: { companyUuid, code: transfer.fromBranchCode } }),
      prisma.appPosBranch.findFirst({ where: { companyUuid, code: transfer.toBranchCode } }),
    ]);

    if (!fromBranch || !toBranch) {
      console.log(`⚠ Cabang ${transfer.fromBranchCode}/${transfer.toBranchCode} tidak ditemukan, lewati 1 dokumen transfer dummy`);
      continue;
    }

    const referenceUuid = uuidv7();

    for (const item of transfer.items) {
      const product = await prisma.appPosProduct.findUnique({ where: { sku: item.sku } });
      if (!product) {
        console.log(`⚠ Produk ${item.sku} tidak ditemukan, lewati item transfer dummy`);
        continue;
      }

      const fromStock = await prisma.appPosProductStock.findFirst({
        where: { companyUuid, productUuid: product.uuid, branchUuid: fromBranch.uuid },
      });
      const fromPreviousStock = Number(fromStock?.stock ?? 0);
      if (!fromStock || fromPreviousStock < item.quantity) {
        console.log(`⚠ Stok ${item.sku} di ${transfer.fromBranchCode} tidak cukup untuk transfer dummy, lewati`);
        continue;
      }
      const fromNewStock = fromPreviousStock - item.quantity;

      await prisma.appPosProductStock.update({
        where: { uuid: fromStock.uuid },
        data: { stock: fromNewStock },
      });
      await prisma.appPosStockMovement.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          branchUuid: fromBranch.uuid,
          productUuid: product.uuid,
          movementType: "transfer_out",
          quantity: -item.quantity,
          previousStock: fromPreviousStock,
          newStock: fromNewStock,
          referenceType: "stock_transfer",
          referenceUuid,
          notes: transfer.notes,
          createdBy: admin.id,
        },
      });

      const toStock = await prisma.appPosProductStock.findFirst({
        where: { companyUuid, productUuid: product.uuid, branchUuid: toBranch.uuid },
      });
      const toPreviousStock = Number(toStock?.stock ?? 0);
      const toNewStock = toPreviousStock + item.quantity;

      if (toStock) {
        await prisma.appPosProductStock.update({
          where: { uuid: toStock.uuid },
          data: { stock: toNewStock },
        });
      } else {
        await prisma.appPosProductStock.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            productUuid: product.uuid,
            branchUuid: toBranch.uuid,
            stock: toNewStock,
          },
        });
      }

      await prisma.appPosStockMovement.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          branchUuid: toBranch.uuid,
          productUuid: product.uuid,
          movementType: "transfer_in",
          quantity: item.quantity,
          previousStock: toPreviousStock,
          newStock: toNewStock,
          referenceType: "stock_transfer",
          referenceUuid,
          notes: transfer.notes,
          createdBy: admin.id,
        },
      });

      itemsCreated += 1;
    }
  }

  console.log(`✓ ${itemsCreated} item stock transfer dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedStockTransfers(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
