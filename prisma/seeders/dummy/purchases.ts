/**
 * Dummy seeder untuk purchases (pembelian).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/purchases.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";

const PURCHASES_DATA = [
  {
    purchaseNumber: "PO-2026-001",
    purchaseDate: new Date("2026-03-05"),
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
    purchaseDate: new Date("2026-03-10"),
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
    purchaseDate: new Date("2026-03-12"),
    paymentStatus: "pending",
    paidAmount: 0,
    notes: "Pembelian tambahan",
    items: [
      { code: "PRD-004", name: "Token Listrik 200K", qty: 3, unitPrice: 190000 },
      { code: "PRD-001", name: "Voucher Game 100K", qty: 4, unitPrice: 90000 },
    ],
  },
];

async function ensureAdminUser(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@admin.com" },
  });
  if (!admin) {
    console.log("⚠ Admin user not found, skipping purchases seed");
  }
  return admin;
}

async function ensureBranch(prisma: PrismaClient, companyUuid: string) {
  const existing = await prisma.posBranch.findFirst({
    where: { companyUuid },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.posBranch.create({
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
  const existing = await prisma.posSupplier.findFirst({
    where: { companyUuid },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.posSupplier.create({
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
  const existing = await prisma.posProductCategory.findFirst({
    where: { companyUuid },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.posProductCategory.create({
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
  const existing = await prisma.posProduct.findUnique({
    where: { sku: data.code },
  });
  if (existing) return existing;

  return prisma.posProduct.create({
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
    const existing = await prisma.posPurchase.findUnique({
      where: { purchaseNumber: purchase.purchaseNumber },
    });

    if (existing) {
      continue;
    }

    const totalAmount = purchase.items.reduce(
      (sum, item) => sum + item.qty * item.unitPrice,
      0
    );

    const createdPurchase = await prisma.posPurchase.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        purchaseNumber: purchase.purchaseNumber,
        purchaseDate: purchase.purchaseDate,
        branchUuid: branch.uuid,
        supplierUuid: supplier.uuid,
        subtotal: totalAmount,
        discountAmount: 0,
        totalAmount,
        paidAmount: purchase.paidAmount,
        paymentStatus: purchase.paymentStatus as "pending" | "partial" | "paid",
        notes: purchase.notes,
        createdBy: admin.id,
      },
    });

    for (const item of purchase.items) {
      const product = productMap.get(item.code);
      if (!product) continue;

      const subtotal = item.qty * item.unitPrice;

      await prisma.posPurchaseItem.create({
        data: {
          uuid: uuidv7(),
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

      const stock = await prisma.posProductStock.findFirst({
        where: {
          productUuid: product.uuid,
          branchUuid: branch.uuid,
        },
      });

      const quantityBefore = stock ? stock.stock : 0;
      const quantityAfter = quantityBefore + item.qty;

      if (stock) {
        await prisma.posProductStock.update({
          where: { uuid: stock.uuid },
          data: { stock: quantityAfter },
        });
      } else {
        await prisma.posProductStock.create({
          data: {
            uuid: uuidv7(),
            productUuid: product.uuid,
            branchUuid: branch.uuid,
            stock: quantityAfter,
          },
        });
      }

      await prisma.posStockMovement.create({
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
          notes: `Purchase from ${supplier.name}`,
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
