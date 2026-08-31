/*
  Warnings:

  - Added the required column `company_uuid` to the `pos_branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_product_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_product_stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_product_barcodes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_product_unit_conversions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_product_branch_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_product_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_purchase_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "app_pos_branches" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "app_pos_branches_code_key";

-- AlterTable
ALTER TABLE "app_pos_customers" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_payment_methods" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "app_pos_payment_methods_code_key";

-- AlterTable
ALTER TABLE "app_pos_product_categories" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_products" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_purchases" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_sales" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_stock_movements" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_product_stocks" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_product_barcodes" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_product_unit_conversions" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_product_branch_prices" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_product_images" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_purchase_items" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_sale_items" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "app_pos_suppliers" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "uuid" CHAR(36) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "company_users" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" VARCHAR(50),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "invitation_accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "company_invitation_tokens" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "company_user_uuid" CHAR(36) NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_invitation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE INDEX "company_users_user_id_idx" ON "company_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_company_uuid_user_id_key" ON "company_users"("company_uuid", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_invitation_tokens_uuid_key" ON "company_invitation_tokens"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "company_invitation_tokens_token_hash_key" ON "company_invitation_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "company_invitation_tokens_company_user_uuid_idx" ON "company_invitation_tokens"("company_user_uuid");

-- CreateIndex
CREATE INDEX "app_pos_branches_company_uuid_idx" ON "app_pos_branches"("company_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_branches_company_uuid_code_key" ON "app_pos_branches"("company_uuid", "code");

-- CreateIndex
CREATE INDEX "app_pos_customers_company_uuid_idx" ON "app_pos_customers"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_payment_methods_company_uuid_idx" ON "app_pos_payment_methods"("company_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_payment_methods_company_uuid_code_key" ON "app_pos_payment_methods"("company_uuid", "code");

-- CreateIndex
CREATE INDEX "app_pos_product_categories_company_uuid_idx" ON "app_pos_product_categories"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_products_company_uuid_idx" ON "app_pos_products"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_purchases_company_uuid_idx" ON "app_pos_purchases"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_sales_company_uuid_idx" ON "app_pos_sales"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_stock_movements_company_uuid_idx" ON "app_pos_stock_movements"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_product_stocks_company_uuid_idx" ON "app_pos_product_stocks"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_product_barcodes_company_uuid_idx" ON "app_pos_product_barcodes"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_product_unit_conversions_company_uuid_idx" ON "app_pos_product_unit_conversions"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_product_branch_prices_company_uuid_idx" ON "app_pos_product_branch_prices"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_product_images_company_uuid_idx" ON "app_pos_product_images"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_purchase_items_company_uuid_idx" ON "app_pos_purchase_items"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_sale_items_company_uuid_idx" ON "app_pos_sale_items"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_suppliers_company_uuid_idx" ON "app_pos_suppliers"("company_uuid");

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_invitation_tokens" ADD CONSTRAINT "company_invitation_tokens_company_user_uuid_fkey" FOREIGN KEY ("company_user_uuid") REFERENCES "company_users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_categories" ADD CONSTRAINT "app_pos_product_categories_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_branches" ADD CONSTRAINT "app_pos_branches_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_products" ADD CONSTRAINT "app_pos_products_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_suppliers" ADD CONSTRAINT "app_pos_suppliers_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_purchases" ADD CONSTRAINT "app_pos_purchases_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_stock_movements" ADD CONSTRAINT "app_pos_stock_movements_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_stocks" ADD CONSTRAINT "app_pos_product_stocks_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_barcodes" ADD CONSTRAINT "app_pos_product_barcodes_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_unit_conversions" ADD CONSTRAINT "app_pos_product_unit_conversions_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_branch_prices" ADD CONSTRAINT "app_pos_product_branch_prices_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_images" ADD CONSTRAINT "app_pos_product_images_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_purchase_items" ADD CONSTRAINT "app_pos_purchase_items_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_sale_items" ADD CONSTRAINT "app_pos_sale_items_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_payment_methods" ADD CONSTRAINT "app_pos_payment_methods_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_customers" ADD CONSTRAINT "app_pos_customers_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_sales" ADD CONSTRAINT "app_pos_sales_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "plans" (
    "uuid" CHAR(36) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "duration_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "company_subscriptions" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "plan_uuid" CHAR(36) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "subscription_invoices" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "plan_uuid" CHAR(36) NOT NULL,
    "provider" VARCHAR(20) NOT NULL DEFAULT 'mayar',
    "provider_invoice_id" VARCHAR(100) NOT NULL,
    "provider_transaction_id" VARCHAR(100),
    "amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "payment_link" TEXT,
    "paid_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_company_uuid_key" ON "company_subscriptions"("company_uuid");

-- CreateIndex
CREATE INDEX "company_subscriptions_plan_uuid_idx" ON "company_subscriptions"("plan_uuid");

-- CreateIndex
CREATE INDEX "company_subscriptions_expires_at_idx" ON "company_subscriptions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_invoices_provider_invoice_id_key" ON "subscription_invoices"("provider_invoice_id");

-- CreateIndex
CREATE INDEX "subscription_invoices_company_uuid_idx" ON "subscription_invoices"("company_uuid");

-- CreateIndex
CREATE INDEX "subscription_invoices_status_idx" ON "subscription_invoices"("status");

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_plan_uuid_fkey" FOREIGN KEY ("plan_uuid") REFERENCES "plans"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_plan_uuid_fkey" FOREIGN KEY ("plan_uuid") REFERENCES "plans"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_roles" ADD CONSTRAINT "app_roles_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_model_has_roles" ADD CONSTRAINT "app_model_has_roles_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
