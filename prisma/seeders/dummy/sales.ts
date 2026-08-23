/**
 * Dummy seeder untuk penjualan POS.
 * Jalankan: npm run seed:dummy:file prisma/seeders/dummy/sales.ts
 */
import { PrismaClient } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";
import { getDefaultCompanyUuid } from "../company";
import { DEFAULT_ADMIN_EMAIL } from "../users";

type ProductCandidate = {
  uuid: string;
  name: string;
  sku: string;
  sellingPrice: number;
};

type ProductStockCandidate = {
  stockUuid: string;
  productUuid: string;
  stock: number;
};

type SaleSeedItem = {
  productSlot: number;
  qty: number;
  discount?: number;
};

type SaleSeed = {
  saleNumber: string;
  saleDate: string;
  paymentCode: string;
  customerIndex?: number;
  paymentStatus: "paid" | "partial" | "pending";
  notes: string;
  items: SaleSeedItem[];
};

const SALES_DATA: SaleSeed[] = [
  {
    saleNumber: "INV-20260420-001",
    saleDate: "2026-04-20",
    paymentCode: "CASH",
    customerIndex: 0,
    paymentStatus: "paid",
    notes: "Penjualan retail pagi hari",
    items: [
      { productSlot: 0, qty: 2 },
      { productSlot: 1, qty: 1, discount: 1000 },
    ],
  },
  {
    saleNumber: "INV-20260420-002",
    saleDate: "2026-04-20",
    paymentCode: "DANA",
    customerIndex: 1,
    paymentStatus: "paid",
    notes: "Pembayaran Dana",
    items: [
      { productSlot: 2, qty: 3 },
      { productSlot: 3, qty: 1 },
    ],
  },
  {
    saleNumber: "INV-20260420-003",
    saleDate: "2026-04-20",
    paymentCode: "BCA",
    customerIndex: 2,
    paymentStatus: "partial",
    notes: "Pembayaran transfer sebagian",
    items: [
      { productSlot: 4, qty: 2 },
      { productSlot: 5, qty: 2, discount: 2000 },
    ],
  },
  {
    saleNumber: "INV-20260420-004",
    saleDate: "2026-04-20",
    paymentCode: "CASH",
    paymentStatus: "pending",
    notes: "Pelanggan bayar nanti",
    items: [
      { productSlot: 1, qty: 1 },
      { productSlot: 6, qty: 2 },
    ],
  },
  {
    saleNumber: "INV-20260420-005",
    saleDate: "2026-04-20",
    paymentCode: "GOPAY",
    customerIndex: 3,
    paymentStatus: "paid",
    notes: "Pembayaran e-wallet",
    items: [
      { productSlot: 7, qty: 1 },
      { productSlot: 0, qty: 1 },
    ],
  },
];

async function ensureAdminUser(prisma: PrismaClient) {
  return prisma.user.findFirst({
    where: { email: DEFAULT_ADMIN_EMAIL },
    select: { id: true },
  });
}

async function ensureBranch(prisma: PrismaClient, companyUuid: string) {
  const branch = await prisma.appPosBranch.findFirst({
    where: {
      companyUuid,
      isActive: true,
    },
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    select: { uuid: true, name: true },
  });
  return branch;
}

async function getSaldoAccounts(prisma: PrismaClient, companyUuid: string) {
  const accounts = await prisma.appPosSaldoAccount.findMany({
    where: {
      companyUuid,
      isActive: true,
      isPaymentMethod: true,
    },
    select: { uuid: true, code: true, name: true, balance: true },
  });

  return accounts;
}

async function getCustomers(prisma: PrismaClient, companyUuid: string) {
  return prisma.appPosCustomer.findMany({
    where: { companyUuid },
    orderBy: { createdAt: "asc" },
    select: { uuid: true, name: true },
  });
}

async function getProductCandidates(prisma: PrismaClient, companyUuid: string, branchUuid: string) {
  const stocks = await prisma.appPosProductStock.findMany({
    where: {
      companyUuid,
      branchUuid,
      stock: { gt: 0 },
      product: {
        isActive: true,
      },
    },
    orderBy: { stock: "desc" },
    take: 16,
    select: {
      uuid: true,
      productUuid: true,
      stock: true,
      product: {
        select: {
          uuid: true,
          name: true,
          sku: true,
          sellingPrice: true,
        },
      },
    },
  });

  const products: ProductCandidate[] = [];
  const stockMap = new Map<string, ProductStockCandidate>();

  for (const row of stocks) {
    if (!row.product) continue;
    products.push({
      uuid: row.product.uuid,
      name: row.product.name,
      sku: row.product.sku,
      sellingPrice: Number(row.product.sellingPrice),
    });
    stockMap.set(row.productUuid, {
      stockUuid: row.uuid,
      productUuid: row.productUuid,
      stock: row.stock,
    });
  }

  return { products, stockMap };
}

function resolvePaidAmount(totalAmount: number, paymentStatus: "paid" | "partial" | "pending") {
  if (paymentStatus === "pending") return 0;
  if (paymentStatus === "partial") {
    const partial = Math.floor(totalAmount * 0.6);
    return partial > 0 ? partial : Math.min(totalAmount, 1000);
  }
  return totalAmount;
}

export async function seedSales(prisma: PrismaClient) {
  const companyUuid = await getDefaultCompanyUuid(prisma);
  const admin = await ensureAdminUser(prisma);
  if (!admin) {
    console.log("⚠ Admin user not found, skipping sales seed");
    return;
  }

  const branch = await ensureBranch(prisma, companyUuid);
  if (!branch) {
    console.log("⚠ Active branch not found, skipping sales seed");
    return;
  }

  const [saldoAccounts, customers, productData] = await Promise.all([
    getSaldoAccounts(prisma, companyUuid),
    getCustomers(prisma, companyUuid),
    getProductCandidates(prisma, companyUuid, branch.uuid),
  ]);

  if (saldoAccounts.length === 0) {
    console.log("⚠ Saldo account not found, skipping sales seed");
    return;
  }

  if (productData.products.length < 3) {
    console.log("⚠ Not enough products with stock, skipping sales seed");
    return;
  }

  const saldoAccountByCode = new Map(saldoAccounts.map((item) => [item.code, item]));
  const runningBalance = new Map(saldoAccounts.map((item) => [item.uuid, Number(item.balance)]));
  let createdCount = 0;

  for (const saleSeed of SALES_DATA) {
    const existing = await prisma.appPosSale.findUnique({
      where: { saleNumber: saleSeed.saleNumber },
      select: { uuid: true },
    });
    if (existing) continue;

    const selectedItems = saleSeed.items
      .map((item) => {
        const product = productData.products[item.productSlot % productData.products.length];
        const stockRow = productData.stockMap.get(product.uuid);
        const availableQty = stockRow?.stock ?? 0;
        const qty = Math.min(item.qty, availableQty);

        if (qty <= 0) return null;

        const unitPrice = product.sellingPrice;
        const discount = item.discount ?? 0;
        const subtotal = qty * unitPrice - discount;

        return {
          product,
          qty,
          unitPrice,
          discount,
          subtotal,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (selectedItems.length === 0) continue;

    const subtotal = selectedItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const itemDiscount = selectedItems.reduce((sum, item) => sum + item.discount, 0);
    const totalAmount = subtotal - itemDiscount;
    const paidAmount = resolvePaidAmount(totalAmount, saleSeed.paymentStatus);
    const changeAmount = Math.max(paidAmount - totalAmount, 0);

    const saldoAccount =
      saldoAccountByCode.get(saleSeed.paymentCode) ||
      saldoAccountByCode.get("CASH") ||
      saldoAccounts[0];

    const customer =
      saleSeed.customerIndex !== undefined && customers.length > 0
        ? customers[saleSeed.customerIndex % customers.length]
        : null;

    const saleDate = new Date(`${saleSeed.saleDate}T00:00:00.000+07:00`);
    const createdAt = new Date(`${saleSeed.saleDate}T09:00:00.000+07:00`);

    await prisma.$transaction(async (tx) => {
      const createdSale = await tx.appPosSale.create({
        data: {
          uuid: uuidv7(),
          companyUuid,
          saleNumber: saleSeed.saleNumber,
          branchUuid: branch.uuid,
          customerUuid: customer?.uuid ?? null,
          paymentMethodUuid: saldoAccount.uuid,
          saleDate,
          subtotal,
          discountAmount: itemDiscount,
          totalAmount,
          paidAmount,
          changeAmount,
          paymentStatus: saleSeed.paymentStatus,
          notes: saleSeed.notes,
          createdBy: admin.id,
          createdAt,
        },
      });

      if (paidAmount > 0) {
        const balanceBefore = runningBalance.get(saldoAccount.uuid) ?? 0;
        const balanceAfter = balanceBefore + paidAmount;
        runningBalance.set(saldoAccount.uuid, balanceAfter);

        await tx.appPosSaldoAccount.update({
          where: { uuid: saldoAccount.uuid },
          data: { balance: balanceAfter },
        });

        await tx.appPosSaldoMutation.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            saldoAccountUuid: saldoAccount.uuid,
            branchUuid: branch.uuid,
            direction: "in",
            amount: paidAmount,
            balanceBefore,
            balanceAfter,
            referenceType: "sale",
            referenceUuid: createdSale.uuid,
            notes: `Dummy sale ${saleSeed.saleNumber}`,
            createdBy: admin.id,
            createdAt,
          },
        });
      }

      for (const item of selectedItems) {
        const stock = await tx.appPosProductStock.findFirst({
          where: {
            companyUuid,
            productUuid: item.product.uuid,
            branchUuid: branch.uuid,
          },
          select: { uuid: true, stock: true },
        });

        if (!stock || stock.stock < item.qty) {
          throw new Error(
            `Insufficient stock for ${item.product.sku}. required=${item.qty} available=${stock?.stock ?? 0}`
          );
        }

        const nextStock = stock.stock - item.qty;

        await tx.appPosSaleItem.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            saleUuid: createdSale.uuid,
            productUuid: item.product.uuid,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal: item.subtotal,
          },
        });

        await tx.appPosProductStock.update({
          where: { uuid: stock.uuid },
          data: { stock: nextStock },
        });

        await tx.appPosStockMovement.create({
          data: {
            uuid: uuidv7(),
            companyUuid,
            branchUuid: branch.uuid,
            productUuid: item.product.uuid,
            movementType: "out",
            quantity: item.qty,
            previousStock: stock.stock,
            newStock: nextStock,
            referenceType: "sale",
            referenceUuid: createdSale.uuid,
            notes: `Dummy sale ${saleSeed.saleNumber}`,
            createdBy: admin.id,
            createdAt,
          },
        });

        const ledger = productData.stockMap.get(item.product.uuid);
        if (ledger) {
          ledger.stock = nextStock;
          productData.stockMap.set(item.product.uuid, ledger);
        }
      }
    });

    createdCount += 1;
  }

  console.log(`✓ ${createdCount} sales dummy created`);
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedSales(prisma)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
