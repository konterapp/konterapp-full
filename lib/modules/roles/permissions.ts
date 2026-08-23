/**
 * Katalog permission tenant — single source of truth DI KODE (bukan di DB).
 * Permission adalah capability aplikasi yang ikut di-deploy bersama kode,
 * jadi daftar ini fixed di compile-time. Nama permission dipakai langsung
 * di withPermission, PermissionGuard, menuItems, lib/routes, dan template
 * role default. Tidak boleh diedit per tenant.
 */
export const PERMISSIONS = [
  // Company profile (identitas perusahaan tenant)
  "company.update",
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
  // POS - Saldo (akun uang konter, sebagian juga bisa jadi metode bayar)
  "pos.saldo.index",
  "pos.saldo.create",
  "pos.saldo.update",
  "pos.saldo.delete",
  // POS - Branch
  "pos.branch.index",
  "pos.branch.create",
  "pos.branch.update",
  "pos.branch.delete",
  // POS - PPOB
  "pos.ppob.index",
  "pos.ppob.create",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
