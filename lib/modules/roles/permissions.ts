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
  // Billing (langganan, invoice, kupon)
  "billing.index",
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
  // WhatsApp (notifikasi via Baileys -- koneksi, pengaturan notifikasi, log)
  "whatsapp.index",
  "whatsapp.update",
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
  // Topup/koreksi saldo (beda dari pos.saldo.update -- itu ubah metadata
  // akun/grup, ini cuma nambah/kurangi nominal). Kasir dapat ini secara
  // default supaya bisa setor uang tunai yang diterima dari pemilik tanpa
  // punya akses kelola akun saldo.
  "pos.saldo.adjust",
  // Lihat nominal saldo ASLI + Selisih saat buka/tutup shift, khusus utk
  // akun yg ditandai show_in_shift=false. Administrator dapat otomatis
  // (isFullAccess), Kasir default TIDAK dapat -- tujuannya blind-count:
  // kasir input hasil hitung fisik tanpa lihat angka sistem, supaya tidak
  // sekadar salin balik angka yg sama (anti-kecurangan). Kalau akun
  // show_in_shift=true, permission ini tidak relevan (semua orang tetap
  // lihat nominalnya seperti biasa).
  "pos.saldo.view-real-balance",
  // POS - Branch
  "pos.branch.index",
  "pos.branch.create",
  "pos.branch.update",
  "pos.branch.delete",
  // POS - Agen Bank (setor/tarik tunai, transfer saldo, bayar BPJS/listrik/dst
  // -- akun bisa bank atau e-wallet). Reuse akun & ledger dari domain Saldo.
  // Jenis transaksinya master data dinamis (sama pola dgn PPOB), jadi punya
  // permission CRUD sendiri.
  "pos.bank-agent-transaction.index",
  "pos.bank-agent-transaction.create",
  "pos.bank-agent-transaction.update",
  "pos.bank-agent-transaction.delete",
  "pos.bank-agent-transaction-type.index",
  "pos.bank-agent-transaction-type.create",
  "pos.bank-agent-transaction-type.update",
  "pos.bank-agent-transaction-type.delete",
  // POS - Server Pulsa/PPOB. Sama polanya dgn Agen Bank (reuse akun & ledger
  // Saldo lewat is_ppob_server), BEDANYA jenis transaksinya master data
  // dinamis (banyak & terus berkembang per operator), jadi punya permission
  // CRUD sendiri.
  "pos.ppob-transaction.index",
  "pos.ppob-transaction.create",
  "pos.ppob-transaction-type.index",
  "pos.ppob-transaction-type.create",
  "pos.ppob-transaction-type.update",
  "pos.ppob-transaction-type.delete",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
