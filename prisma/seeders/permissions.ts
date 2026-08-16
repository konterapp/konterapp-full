import { PrismaClient } from "@prisma/client";

/**
 * Katalog permission tenant (global, jadi acuan untuk semua company).
 * Nama permission dipakai langsung di kode (withPermission, PermissionGuard,
 * menuItems, lib/routes) — tidak boleh diedit per tenant.
 */
export const PERMISSIONS = [
  // User management (kelola user tenant)
  "user.index",
  "user.create",
  "user.update",
  "user.delete",
  // Role management (kelola role tenant)
  "role.index",
  "role.create",
  "role.update",
  "role.delete",
  // POS - Sale (Kasir & Riwayat Transaksi)
  "pos.sale.index",
  "pos.sale.create",
  // POS - Product
  "pos.product.index",
  "pos.product.create",
  "pos.product.update",
  "pos.product.delete",
  // POS - Category
  "pos.category.index",
  "pos.category.create",
  "pos.category.update",
  "pos.category.delete",
  // POS - Unit
  "pos.unit.index",
  "pos.unit.create",
  "pos.unit.update",
  "pos.unit.delete",
  // POS - Supplier
  "pos.supplier.index",
  "pos.supplier.create",
  "pos.supplier.update",
  "pos.supplier.delete",
  // POS - Purchase
  "pos.purchase.index",
  "pos.purchase.create",
  "pos.purchase.delete",
  // POS - Stock Movement
  "pos.stock-movement.index",
  // POS - Report
  "pos.report.index",
  // POS - Payment Method
  "pos.payment-method.index",
  "pos.payment-method.create",
  "pos.payment-method.update",
  "pos.payment-method.delete",
  // POS - Branch
  "pos.branch.index",
  "pos.branch.create",
  "pos.branch.update",
  "pos.branch.delete",
  // POS - PPOB
  "pos.ppob.index",
  "pos.ppob.create",
  // Berita management
  "berita.index",
  "berita.create",
  "berita.update",
  "berita.delete",
];

export async function seedPermissions(prisma: PrismaClient) {
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✓ ${PERMISSIONS.length} permissions created`);
}
