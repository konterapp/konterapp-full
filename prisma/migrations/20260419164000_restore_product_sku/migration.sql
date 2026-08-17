ALTER TABLE "app_pos_products"
ADD COLUMN "sku" VARCHAR(100) NOT NULL;

CREATE UNIQUE INDEX "app_pos_products_sku_key" ON "app_pos_products"("sku");

-- CreateTable
CREATE TABLE "coupons" (
    "uuid" CHAR(36) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "max_discount" DECIMAL(15,2),
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- AlterTable
ALTER TABLE "subscription_invoices"
ADD COLUMN "coupon_code" VARCHAR(50),
ADD COLUMN "discount_amount" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "coupons"
ADD COLUMN "plan_code" VARCHAR(50);

-- CreateTable plan_tiers
CREATE TABLE "plan_tiers" (
    "uuid" CHAR(36) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "max_branches" INTEGER,
    "max_users" INTEGER,
    "max_products" INTEGER,
    "max_transactions_per_month" INTEGER,
    "features" JSONB NOT NULL DEFAULT '[]',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_tiers_pkey" PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX "plan_tiers_code_key" ON "plan_tiers"("code");

-- Seed plan_tiers
INSERT INTO "plan_tiers" ("uuid", "code", "name", "description", "max_branches", "max_users", "max_products", "max_transactions_per_month", "features", "display_order", "is_active") VALUES
    ('01a00b6c-de49-7359-91ca-758c3b251fd9', 'free', 'Free', 'Paket gratis selamanya untuk konter & toko kecil.', 1, 3, 100, 1000, '["Transaksi PPOB tanpa batas","Kasir digital (POS) lengkap","Laporan penjualan & stok","1 cabang","3 pengguna","100 produk","1000 transaksi/bulan"]', 1, true),
    ('01a00b6c-de4d-717b-8e7a-138102912ab2', 'starter', 'Starter', 'Untuk konter & toko kecil yang mulai berkembang.', 1, 3, 500, 5000, '["Semua fitur Free","1 cabang","3 pengguna","500 produk","5000 transaksi/bulan","Struk dengan nama toko sendiri"]', 2, true),
    ('01a00b6c-de4d-717b-8e7a-14c92b2c93f8', 'growth', 'Growth', 'Untuk usaha yang berkembang dengan beberapa cabang.', 3, 9, 2000, 20000, '["Semua fitur Starter","3 cabang","9 pengguna","2000 produk","20000 transaksi/bulan","Multi kasir","Laporan laba-rugi detail"]', 3, true),
    ('01a00b6c-de4d-717b-8e7a-1b72c783a84a', 'pro', 'Pro', 'Untuk bisnis multi cabang dengan kebutuhan penuh.', 10, 30, 10000, 100000, '["Semua fitur Growth","10 cabang","30 pengguna","10000 produk","100000 transaksi/bulan","Prioritas dukungan 24 jam","Manajemen multi toko"]', 4, true);

-- AlterTable plans
ALTER TABLE "plans"
ALTER COLUMN "duration_days" DROP NOT NULL,
ADD COLUMN "tier_uuid" CHAR(36),
ADD COLUMN "billing_period" VARCHAR(10),
ADD COLUMN "description" VARCHAR(255),
ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;

-- Migrasi data plans: petakan plan lama ke tier baru + rename kode plan
UPDATE "plans" SET "code" = 'starter-monthly', "name" = 'Starter Bulanan', "tier_uuid" = '01a00b6c-de4d-717b-8e7a-138102912ab2', "billing_period" = 'monthly', "description" = 'Paket bulanan tier Starter.', "display_order" = 2 WHERE "code" = 'monthly';
UPDATE "plans" SET "code" = 'starter-yearly', "name" = 'Starter Tahunan', "tier_uuid" = '01a00b6c-de4d-717b-8e7a-138102912ab2', "billing_period" = 'yearly', "description" = 'Paket tahunan tier Starter.', "display_order" = 3 WHERE "code" = 'yearly';
-- Free selamanya: plan gratis tanpa masa kedaluwarsa (duration_days NULL).
UPDATE "plans" SET "code" = 'free', "tier_uuid" = '01a00b6c-de49-7359-91ca-758c3b251fd9', "billing_period" = NULL, "duration_days" = NULL, "description" = 'Paket gratis selamanya (tanpa kedaluwarsa).', "display_order" = 1 WHERE "code" = 'free-trial';

-- Insert plan baru tier Growth & Pro
INSERT INTO "plans" ("uuid", "code", "name", "tier_uuid", "billing_period", "description", "price", "duration_days", "display_order", "is_active", "created_at", "updated_at") VALUES
    ('01a00b6c-de4d-717b-8e7a-1f350f762997', 'growth-monthly', 'Growth Bulanan', '01a00b6c-de4d-717b-8e7a-14c92b2c93f8', 'monthly', 'Paket bulanan tier Growth.', 35000, 30, 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('01a00b6c-de4d-717b-8e7a-233d086f1fe9', 'growth-yearly', 'Growth Tahunan', '01a00b6c-de4d-717b-8e7a-14c92b2c93f8', 'yearly', 'Paket tahunan tier Growth.', 350000, 365, 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('01a00b6c-de4d-717b-8e7a-243e8f9132f3', 'pro-monthly', 'Pro Bulanan', '01a00b6c-de4d-717b-8e7a-1b72c783a84a', 'monthly', 'Paket bulanan tier Pro.', 99000, 30, 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('01a00b6c-de4d-717b-8e7a-2bcc63091354', 'pro-yearly', 'Pro Tahunan', '01a00b6c-de4d-717b-8e7a-1b72c783a84a', 'yearly', 'Paket tahunan tier Pro.', 990000, 365, 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- plans.tier_uuid tidak boleh null untuk row yang sudah ada
ALTER TABLE "plans"
ALTER COLUMN "tier_uuid" SET NOT NULL;

CREATE INDEX "plans_tier_uuid_idx" ON "plans"("tier_uuid");

-- Foreign key plans -> plan_tiers
ALTER TABLE "plans"
ADD CONSTRAINT "plans_tier_uuid_fkey" FOREIGN KEY ("tier_uuid") REFERENCES "plan_tiers"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sinkronisasi kupon: kode plan lama -> kode baru
UPDATE "coupons" SET "plan_code" = 'starter-monthly' WHERE "plan_code" = 'monthly';
UPDATE "coupons" SET "plan_code" = 'starter-yearly' WHERE "plan_code" = 'yearly';
-- kupon yang merujuk paket lama bebas (free-trial) mengarah ke plan gratis baru
UPDATE "coupons" SET "plan_code" = 'free' WHERE "plan_code" = 'free-trial';

-- Free selamanya: subscription gratis tidak kedaluwarsa (expires_at nullable)
ALTER TABLE "company_subscriptions"
ALTER COLUMN "expires_at" DROP NOT NULL;

-- AlterTable users: kolom referral
ALTER TABLE "users"
ADD COLUMN "referral_code" VARCHAR(20),
ADD COLUMN "referred_by_user_id" INTEGER,
ADD COLUMN "referral_balance" DECIMAL(15,2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- AlterTable subscription_invoices: kolom referral & user_id
ALTER TABLE "subscription_invoices"
ADD COLUMN "user_id" INTEGER,
ADD COLUMN "referral_code" VARCHAR(20),
ADD COLUMN "referral_discount_amount" DECIMAL(15,2),
ADD COLUMN "referral_balance_used" DECIMAL(15,2);

-- CreateTable referral_commissions
CREATE TABLE "referral_commissions" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "referrer_user_id" INTEGER NOT NULL,
    "referred_user_id" INTEGER NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "invoice_uuid" CHAR(36) NOT NULL,
    "base_amount" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "plan_code" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'paid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_commissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referral_commissions_uuid_key" ON "referral_commissions"("uuid");
CREATE UNIQUE INDEX "referral_commissions_invoice_uuid_key" ON "referral_commissions"("invoice_uuid");
CREATE INDEX "referral_commissions_referrer_user_id_idx" ON "referral_commissions"("referrer_user_id");
CREATE INDEX "referral_commissions_referred_user_id_idx" ON "referral_commissions"("referred_user_id");
