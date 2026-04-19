/*
  Warnings:

  - Added the required column `company_uuid` to the `pos_branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_payment_methods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_ppob_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_ppob_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_product_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_stock_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_uuid` to the `pos_suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pos_branches" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_customers" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_payment_methods" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_ppob_products" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_ppob_transactions" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_product_categories" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_products" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_purchases" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_sales" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_stock_movements" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "pos_suppliers" ADD COLUMN     "company_uuid" CHAR(36) NOT NULL;

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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE INDEX "company_users_user_id_idx" ON "company_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_company_uuid_user_id_key" ON "company_users"("company_uuid", "user_id");

-- CreateIndex
CREATE INDEX "pos_branches_company_uuid_idx" ON "pos_branches"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_customers_company_uuid_idx" ON "pos_customers"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_payment_methods_company_uuid_idx" ON "pos_payment_methods"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_ppob_products_company_uuid_idx" ON "pos_ppob_products"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_ppob_transactions_company_uuid_idx" ON "pos_ppob_transactions"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_product_categories_company_uuid_idx" ON "pos_product_categories"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_products_company_uuid_idx" ON "pos_products"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_purchases_company_uuid_idx" ON "pos_purchases"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_sales_company_uuid_idx" ON "pos_sales"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_stock_movements_company_uuid_idx" ON "pos_stock_movements"("company_uuid");

-- CreateIndex
CREATE INDEX "pos_suppliers_company_uuid_idx" ON "pos_suppliers"("company_uuid");

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_product_categories" ADD CONSTRAINT "pos_product_categories_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_branches" ADD CONSTRAINT "pos_branches_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_products" ADD CONSTRAINT "pos_products_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_suppliers" ADD CONSTRAINT "pos_suppliers_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_purchases" ADD CONSTRAINT "pos_purchases_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_stock_movements" ADD CONSTRAINT "pos_stock_movements_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_payment_methods" ADD CONSTRAINT "pos_payment_methods_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_customers" ADD CONSTRAINT "pos_customers_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sales" ADD CONSTRAINT "pos_sales_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_ppob_products" ADD CONSTRAINT "pos_ppob_products_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_ppob_transactions" ADD CONSTRAINT "pos_ppob_transactions_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
