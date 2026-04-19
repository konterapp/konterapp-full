import { PrismaClient } from "@prisma/client";

const PERMISSIONS = [
  // User management
  "admin.user.index",
  "admin.user.create",
  "admin.user.update",
  "admin.user.delete",
  // Role management
  "admin.role.index",
  "admin.role.create",
  "admin.role.update",
  "admin.role.delete",
  // Slider management
  "admin.slider.index",
  "admin.slider.create",
  "admin.slider.update",
  "admin.slider.delete",
  // POS - Sale (Kasir & Riwayat Transaksi)
  "admin.pos.sale.index",
  "admin.pos.sale.create",
  // POS - Product
  "admin.pos.product.index",
  "admin.pos.product.create",
  "admin.pos.product.update",
  "admin.pos.product.delete",
  // POS - Category
  "admin.pos.category.index",
  "admin.pos.category.create",
  "admin.pos.category.update",
  "admin.pos.category.delete",
  // POS - Unit
  "admin.pos.unit.index",
  "admin.pos.unit.create",
  "admin.pos.unit.update",
  "admin.pos.unit.delete",
  // POS - Supplier
  "admin.pos.supplier.index",
  "admin.pos.supplier.create",
  "admin.pos.supplier.update",
  "admin.pos.supplier.delete",
  // POS - Purchase
  "admin.pos.purchase.index",
  "admin.pos.purchase.create",
  "admin.pos.purchase.delete",
  // POS - Stock Movement
  "admin.pos.stock-movement.index",
  // POS - Report
  "admin.pos.report.index",
  // POS - Payment Method
  "admin.pos.payment-method.index",
  "admin.pos.payment-method.create",
  "admin.pos.payment-method.update",
  "admin.pos.payment-method.delete",
  // POS - Branch
  "admin.pos.branch.index",
  "admin.pos.branch.create",
  "admin.pos.branch.update",
  "admin.pos.branch.delete",
  // POS - PPOB
  "admin.pos.ppob.index",
  "admin.pos.ppob.create",
  // Berita management
  "admin.berita.index",
  "admin.berita.create",
  "admin.berita.update",
  "admin.berita.delete",
];

export async function seedPermissions(prisma: PrismaClient) {
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { permissions_name_guard_name_unique: { name, guardName: "web" } },
      update: {},
      create: { name, guardName: "web" },
    });
  }
  console.log(`✓ ${PERMISSIONS.length} permissions created`);
}
