/**
 * Dummy seeder untuk purchases (pembelian).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/purchases.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_ADMIN_EMAIL } from "../users";
import { dateAtTimeDaysAgo } from "./date-helpers";

// Tanggal RELATIF ke saat seeder dijalankan (bukan statis) -- dipertahankan
// lebih awal dari tanggal sale dummy (lihat sales.ts, daysAgo 2) supaya
// urutan kronologis (beli stok dulu, baru terjual) tetap masuk akal.
const PURCHASES_DATA = [
  {
    purchaseNumber: "PO-2026-001",
    purchaseDate: dateAtTimeDaysAgo(20, "09:00:00"),
    paymentStatus: "paid",
    paidAmount: 1250000,
    notes: "Pembelian stok awal",
    items: [
      { code: "PRD-001", name: "Voucher Game 100K", qty: 5, unitPrice: 90000 },
      { code: "PRD-002", name: "Pulsa 50K", qty: 20, unitPrice: 45000 },
    ],
  },
  {
    purchaseNumber: "PO-2026-002",
    purchaseDate: dateAtTimeDaysAgo(15, "09:00:00"),
    paymentStatus: "partial",
    paidAmount: 500000,
    notes: "Pembelian mingguan",
    items: [
      { code: "PRD-003", name: "Paket Data 10GB", qty: 10, unitPrice: 38000 },
      { code: "PRD-002", name: "Pulsa 50K", qty: 15, unitPrice: 45000 },
    ],
  },
  {
    purchaseNumber: "PO-2026-003",
    purchaseDate: dateAtTimeDaysAgo(13, "09:00:00"),
    paymentStatus: "pending",
    paidAmount: 0,
    notes: "Pembelian tambahan",
    items: [
      { code: "PRD-004", name: "Token Listrik 200K", qty: 3, unitPrice: 190000 },
      { code: "PRD-001", name: "Voucher Game 100K", qty: 4, unitPrice: 90000 },
    ],
  },
  {
    purchaseNumber: "PO-2026-004",
    purchaseDate: dateAtTimeDaysAgo(10, "09:00:00"),
    paymentStatus: "paid",
    paidAmount: 0,
    notes: "Belanja campur pasar (tanpa supplier)",
    supplierMode: "none",
    items: [
      { code: "PRD-005", name: "Earphone Bass In-Ear", qty: 6, unitPrice: 28000 },
      { code: "PRD-006", name: "Powerbank 10000mAh", qty: 2, unitPrice: 175000 },
    ],
  },
];

async function ensureAdminUser(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({
    where: { email: DEFAULT_ADMIN_EMAIL },
  });
  if (!admin) {
    console.log("⚠ Admin user not found, skipping purchases seed");
  }
  return admin;
}

async function ensureBranch(prisma: PrismaClient, companyUuid: string) {
  const existing = await prisma.appPosBranch.findFirst({
    where: { companyUuid },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.appPosBranch.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      code: "CB001",
      name: "Konter Pusat",
      address: "Jl. Margonda Raya No. 1",
      phone: "021-1234567",
      email: "pusat@konterapp.com",
      isActive: true,
      isMain: true,
    },
  });
}

async function ensureSupplier(prisma: PrismaClient, companyUuid: string) {
  const existing = await prisma.appPosSupplier.findFirst({
    where: { companyUuid },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.appPosSupplier.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      code: "SUP-001",
      name: "PT Sumber Makmur",
      contactPerson: "Budi Santoso",
      phone: "081234567890",
      email: "supplier@konterapp.com",
      address: "Jakarta",
      isActive: true,
    },
  });
}

async function ensureCategory(prisma: PrismaClient, companyUuid: string) {
  const existing = await prisma.appPosProductCategory.findFirst({
    where: { companyUuid },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.appPosProductCategory.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      name: "Produk Digital",
      description: "Kategori produk digital",
    },
  });
}

async function ensureProduct(
  prisma: PrismaClient,
  companyUuid: string,
  categoryUuid: string,
  data: { code: string; name: string; sellingPrice: number }
) {
  const existing = await prisma.appPosProduct.findUnique({
    where: { sku: data.code },
  });
  if (existing) return existing;

  return prisma.appPosProduct.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      categoryUuid,
      name: data.name,
      sku: data.code,
      barcode: data.code,
      sellingPrice: data.sellingPrice,
      unit: "pcs",
      isActive: true,
    },
  });
}

export async function seedPurchases(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdminUser(prisma);
  if (!admin) return;

  const branch = await ensureBranch(prisma, companyUuid);
  const supplier = await ensureSupplier(prisma, companyUuid);
  const category = await ensureCategory(prisma, companyUuid);

  const productMap = new Map<string, { uuid: string; name: string }>();
  const allItems = PURCHASES_DATA.flatMap((purchase) => purchase.items);

  for (const item of allItems) {
    if (!productMap.has(item.code)) {
      const product = await ensureProduct(prisma, companyUuid, category.uuid, {
        code: item.code,
        name: item.name,
        sellingPrice: item.unitPrice + 10000,
      });
      productMap.set(item.code, { uuid: product.uuid, name: product.name });
    }
  }

  for (const purchase of PURCHASES_DATA) {
    const existing = await prisma.appPosPurchase.findUnique({
      where: { purchaseNumber: purchase.purchaseNumber },
    });

    if (existing) {
      continue;
    }

    const totalAmount = purchase.items.reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0
    );
    const hasSupplier = purchase.supplierMode !== "none";

    const createdPurchase = await prisma.appPosPurchase.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        purchaseNumber: purchase.purchaseNumber,
        purchaseDate: purchase.purchaseDate,
        branchUuid: branch.uuid,
        supplierUuid: hasSupplier ? supplier.uuid : null,
        subtotal: totalAmount,
        discountAmount: 0,
        totalAmount,
        paidAmount: hasSupplier ? purchase.paidAmount : totalAmount,
        paymentStatus: (hasSupplier ? purchase.paymentStatus : "paid") as "pending" | "partial" | "paid",
        notes: purchase.notes,
        createdBy: admin.id,
      },
    });

    for (const item of purchase.items) {
      const product = productMap.get(item.code);
      if (!product) continue;

      const subtotal = item.qty * item.unitPrice;

      await prisma.appPosPurchaseItem.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          purchaseUuid: createdPurchase.uuid,
          productUuid: product.uuid,
          quantity: item.qty,
          purchaseUnit: "pcs",
          factorToBase: 1,
          quantityBase: item.qty,
          unitPrice: item.unitPrice,
          discount: 0,
          subtotal,
        },
      });

      const stock = await prisma.appPosProductStock.findFirst({
        where: {
          companyUuid,
          productUuid: product.uuid,
          branchUuid: branch.uuid,
        },
      });

      const quantityBefore = stock ? stock.stock : 0;
      const quantityAfter = quantityBefore + item.qty;

      if (stock) {
        await prisma.appPosProductStock.update({
          where: { uuid: stock.uuid },
          data: { stock: quantityAfter },
        });
      } else {
        await prisma.appPosProductStock.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            productUuid: product.uuid,
            branchUuid: branch.uuid,
            stock: quantityAfter,
          },
        });
      }

      await prisma.appPosStockMovement.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          productUuid: product.uuid,
          branchUuid: branch.uuid,
          movementType: "purchase",
          quantity: item.qty,
          previousStock: quantityBefore,
          newStock: quantityAfter,
          referenceType: "Purchase",
          referenceUuid: createdPurchase.uuid,
          notes: hasSupplier ? `Purchase from ${supplier.name}` : "Purchase tanpa supplier",
          createdBy: admin.id,
        },
      });
    }
  }

  console.log(`✓ ${PURCHASES_DATA.length} purchases dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedPurchases(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
