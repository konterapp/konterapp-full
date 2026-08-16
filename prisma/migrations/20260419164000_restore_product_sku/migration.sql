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
