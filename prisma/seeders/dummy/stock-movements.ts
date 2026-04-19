/**
 * Dummy seeder untuk stock movements (pergerakan stok).
 * Jalankan: npm run seed:dummy prisma/seeders/dummy/stock-movements.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";

const MOVEMENTS_DATA = [
  {
    sku: "PRD-001",
    name: "Voucher Game 100K",
    movementType: "adjustment",
    quantityChange: -2,
    referenceType: "Adjustment",
    notes: "Penyesuaian stok (rusak)",
  },
  {
    sku: "PRD-002",
    name: "Pulsa 50K",
    movementType: "sale",
    quantityChange: -5,
    referenceType: "Sale",
    notes: "Penjualan manual",
  },
  {
    sku: "PRD-003",
    name: "Paket Data 10GB",
    movementType: "transfer_in",
    quantityChange: 10,
    referenceType: "Transfer",
    notes: "Transfer masuk cabang",
  },
  {
    sku: "PRD-004",
    name: "Token Listrik 200K",
    movementType: "transfer_out",
    quantityChange: -1,
    referenceType: "Transfer",
    notes: "Transfer keluar cabang",
  },
  {
    sku: "PRD-002",
    name: "Pulsa 50K",
    movementType: "purchase",
    quantityChange: 8,
    referenceType: "Purchase",
    notes: "Pembelian tambahan",
  },
];

async function ensureAdminUser(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@admin.com" },
  });
  if (!admin) {
    console.log("⚠ Admin user not found, skipping stock movements seed");
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
  data: { sku: string; name: string; sellingPrice: number }
) {
  const existing = await prisma.posProduct.findUnique({
    where: { sku: data.sku },
  });
  if (existing) return existing;

  return prisma.posProduct.create({
    data: {
      uuid: uuidv7(),
      companyUuid,
      categoryUuid,
      name: data.name,
      sku: data.sku,
      sellingPrice: data.sellingPrice,
      unit: "pcs",
      isActive: true,
    },
  });
}

export async function seedStockMovements(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdminUser(prisma);
  if (!admin) return;

  const branch = await ensureBranch(prisma, companyUuid);
  const category = await ensureCategory(prisma, companyUuid);

  const productMap = new Map<string, { uuid: string }>();
  for (const movement of MOVEMENTS_DATA) {
    if (!productMap.has(movement.sku)) {
      const product = await ensureProduct(prisma, companyUuid, category.uuid, {
        sku: movement.sku,
        name: movement.name,
        sellingPrice: 100000,
      });
      productMap.set(movement.sku, { uuid: product.uuid });
    }
  }

  for (const movement of MOVEMENTS_DATA) {
    const product = productMap.get(movement.sku);
    if (!product) continue;

    let stock = await prisma.posProductStock.findFirst({
      where: {
        productUuid: product.uuid,
        branchUuid: branch.uuid,
      },
    });

    if (!stock) {
      const baseStock = movement.quantityChange < 0 ? Math.abs(movement.quantityChange) + 5 : 0;
      stock = await prisma.posProductStock.create({
        data: {
          uuid: uuidv7(),
          productUuid: product.uuid,
          branchUuid: branch.uuid,
          stock: baseStock,
        },
      });
    }

    let quantityBefore = stock.stock;
    if (movement.quantityChange < 0 && quantityBefore + movement.quantityChange < 0) {
      quantityBefore = Math.abs(movement.quantityChange);
      await prisma.posProductStock.update({
        where: { uuid: stock.uuid },
        data: { stock: quantityBefore },
      });
    }

    const quantityAfter = quantityBefore + movement.quantityChange;

    await prisma.posProductStock.update({
      where: { uuid: stock.uuid },
      data: { stock: quantityAfter },
    });

    await prisma.posStockMovement.create({
      data: {
        uuid: uuidv7(),
        companyUuid,
        productUuid: product.uuid,
        branchUuid: branch.uuid,
        movementType: movement.movementType,
        quantity: movement.quantityChange,
        previousStock: quantityBefore,
        newStock: quantityAfter,
        referenceType: movement.referenceType,
        notes: movement.notes,
        createdBy: admin.id,
      },
    });
  }

  console.log(`✓ ${MOVEMENTS_DATA.length} stock movements dummy created`);
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  seedStockMovements(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
