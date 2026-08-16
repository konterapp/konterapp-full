-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "password" VARCHAR(255) NOT NULL,
    "remember_token" VARCHAR(100),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrators" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "administrators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_uuid_key" ON "email_verification_tokens"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_uuid_key" ON "password_reset_tokens"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE "app_roles" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "is_full_access" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_model_has_roles" (
    "role_id" INTEGER NOT NULL,
    "model_type" VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User',
    "model_id" INTEGER NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,

    CONSTRAINT "app_model_has_roles_pkey" PRIMARY KEY ("role_id","model_type","model_id","company_uuid")
);

-- CreateTable
CREATE TABLE "berita" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "image" VARCHAR(255),
    "tags" JSONB,
    "published_at" DATE,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "news_type" VARCHAR(50),
    "category" VARCHAR(50),
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "berita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_role_has_permissions" (
    "permission_name" VARCHAR(255) NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "app_role_has_permissions_pkey" PRIMARY KEY ("role_id","permission_name")
);

-- CreateTable
CREATE TABLE "app_pos_product_categories" (
    "uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_product_categories_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_branches" (
    "uuid" CHAR(36) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_branches_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_products" (
    "uuid" CHAR(36) NOT NULL,
    "category_uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "barcode" VARCHAR(100),
    "purchase_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL,
    "wholesale_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'pcs',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_products_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_product_barcodes" (
    "uuid" CHAR(36) NOT NULL,
    "product_uuid" CHAR(36) NOT NULL,
    "barcode" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_product_barcodes_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_product_unit_conversions" (
    "uuid" CHAR(36) NOT NULL,
    "product_uuid" CHAR(36) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "factor_to_base" DECIMAL(12,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_product_unit_conversions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_product_branch_prices" (
    "uuid" CHAR(36) NOT NULL,
    "product_uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "wholesale_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_product_branch_prices_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_product_images" (
    "uuid" CHAR(36) NOT NULL,
    "product_uuid" CHAR(36) NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_product_images_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_product_stocks" (
    "uuid" CHAR(36) NOT NULL,
    "product_uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_product_stocks_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_suppliers" (
    "uuid" CHAR(36) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_person" VARCHAR(255),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_suppliers_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_purchases" (
    "uuid" CHAR(36) NOT NULL,
    "purchase_number" VARCHAR(50) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "supplier_uuid" CHAR(36),
    "purchase_date" DATE NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_purchases_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_purchase_items" (
    "uuid" CHAR(36) NOT NULL,
    "purchase_uuid" CHAR(36) NOT NULL,
    "product_uuid" CHAR(36) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchase_unit" VARCHAR(20) NOT NULL DEFAULT 'pcs',
    "factor_to_base" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "quantity_base" INTEGER NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_purchase_items_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_stock_movements" (
    "uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "product_uuid" CHAR(36) NOT NULL,
    "movement_type" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previous_stock" INTEGER NOT NULL,
    "new_stock" INTEGER NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_uuid" CHAR(36),
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_pos_stock_movements_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_payment_methods" (
    "uuid" CHAR(36) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'cash',
    "account_number" VARCHAR(100),
    "account_name" VARCHAR(100),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_payment_methods_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_customers" (
    "uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_customers_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_sales" (
    "uuid" CHAR(36) NOT NULL,
    "sale_number" VARCHAR(50) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "customer_uuid" CHAR(36),
    "payment_method_uuid" CHAR(36) NOT NULL,
    "sale_date" DATE NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "change_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_status" VARCHAR(20) NOT NULL DEFAULT 'paid',
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_sales_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_sale_items" (
    "uuid" CHAR(36) NOT NULL,
    "sale_uuid" CHAR(36) NOT NULL,
    "product_uuid" CHAR(36) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_sale_items_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_ppob_products" (
    "uuid" CHAR(36) NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "provider_product_code" VARCHAR(100) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "brand" VARCHAR(100),
    "category" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "seller_name" VARCHAR(255),
    "base_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "admin_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "digiflazz_type" VARCHAR(50),
    "buyer_product_status" BOOLEAN NOT NULL DEFAULT true,
    "seller_product_status" BOOLEAN NOT NULL DEFAULT true,
    "unlimited_stock" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "multi" BOOLEAN NOT NULL DEFAULT false,
    "start_cut_off" VARCHAR(10),
    "end_cut_off" VARCHAR(10),
    "desc" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "provider_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_ppob_products_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_ppob_transactions" (
    "uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "transaction_number" VARCHAR(50) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "product_code" VARCHAR(100) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "customer_number" VARCHAR(100) NOT NULL,
    "customer_name" VARCHAR(255),
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "admin_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "selling_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "profit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_method_uuid" CHAR(36),
    "provider_reference" VARCHAR(255),
    "provider" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "provider_response" JSONB,
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_ppob_transactions_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "administrators_uuid_key" ON "administrators"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "administrators_email_key" ON "administrators"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_roles_uuid_key" ON "app_roles"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "roles_company_uuid_name_key" ON "app_roles"("company_uuid", "name");

-- CreateIndex
CREATE INDEX "app_roles_company_uuid_idx" ON "app_roles"("company_uuid");

-- CreateIndex
CREATE INDEX "app_model_has_roles_model_id_model_type_index" ON "app_model_has_roles"("model_id", "model_type");

-- CreateIndex
CREATE INDEX "app_model_has_roles_company_uuid_idx" ON "app_model_has_roles"("company_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "berita_uuid_key" ON "berita"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "berita_slug_key" ON "berita"("slug");

-- CreateIndex
CREATE INDEX "berita_slug_idx" ON "berita"("slug");

-- CreateIndex
CREATE INDEX "berita_is_published_idx" ON "berita"("is_published");

-- CreateIndex
CREATE INDEX "berita_created_by_idx" ON "berita"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_branches_code_key" ON "app_pos_branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_products_sku_key" ON "app_pos_products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_product_barcodes_barcode_key" ON "app_pos_product_barcodes"("barcode");

-- CreateIndex
CREATE INDEX "app_pos_product_barcodes_product_uuid_idx" ON "app_pos_product_barcodes"("product_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_product_unit_conversions_product_uuid_unit_key" ON "app_pos_product_unit_conversions"("product_uuid", "unit");

-- CreateIndex
CREATE INDEX "app_pos_product_unit_conversions_product_uuid_idx" ON "app_pos_product_unit_conversions"("product_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_product_branch_prices_product_uuid_branch_uuid_key" ON "app_pos_product_branch_prices"("product_uuid", "branch_uuid");

-- CreateIndex
CREATE INDEX "app_pos_product_branch_prices_branch_uuid_idx" ON "app_pos_product_branch_prices"("branch_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_product_stocks_product_uuid_branch_uuid_key" ON "app_pos_product_stocks"("product_uuid", "branch_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_suppliers_code_key" ON "app_pos_suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_purchases_purchase_number_key" ON "app_pos_purchases"("purchase_number");

-- CreateIndex
CREATE INDEX "app_pos_stock_movements_branch_uuid_idx" ON "app_pos_stock_movements"("branch_uuid");

-- CreateIndex
CREATE INDEX "app_pos_stock_movements_product_uuid_idx" ON "app_pos_stock_movements"("product_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_payment_methods_code_key" ON "app_pos_payment_methods"("code");

-- CreateIndex
CREATE INDEX "app_pos_customers_phone_idx" ON "app_pos_customers"("phone");

-- CreateIndex
CREATE INDEX "app_pos_customers_name_idx" ON "app_pos_customers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_sales_sale_number_key" ON "app_pos_sales"("sale_number");

-- CreateIndex
CREATE INDEX "app_pos_sales_sale_date_idx" ON "app_pos_sales"("sale_date");

-- CreateIndex
CREATE INDEX "app_pos_sales_payment_status_idx" ON "app_pos_sales"("payment_status");

-- CreateIndex
CREATE INDEX "app_pos_ppob_products_category_idx" ON "app_pos_ppob_products"("category");

-- CreateIndex
CREATE INDEX "app_pos_ppob_products_brand_idx" ON "app_pos_ppob_products"("brand");

-- CreateIndex
CREATE INDEX "app_pos_ppob_products_is_active_idx" ON "app_pos_ppob_products"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_ppob_products_provider_provider_product_code_key" ON "app_pos_ppob_products"("provider", "provider_product_code");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_ppob_transactions_transaction_number_key" ON "app_pos_ppob_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "app_pos_ppob_transactions_branch_uuid_idx" ON "app_pos_ppob_transactions"("branch_uuid");

-- CreateIndex
CREATE INDEX "app_pos_ppob_transactions_status_idx" ON "app_pos_ppob_transactions"("status");

-- CreateIndex
CREATE INDEX "app_pos_ppob_transactions_created_at_idx" ON "app_pos_ppob_transactions"("created_at");

-- AddForeignKey
ALTER TABLE "app_model_has_roles" ADD CONSTRAINT "app_model_has_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "app_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_model_has_roles" ADD CONSTRAINT "app_model_has_roles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "berita" ADD CONSTRAINT "berita_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_role_has_permissions" ADD CONSTRAINT "app_role_has_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "app_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_products" ADD CONSTRAINT "app_pos_products_category_uuid_fkey" FOREIGN KEY ("category_uuid") REFERENCES "app_pos_product_categories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_barcodes" ADD CONSTRAINT "app_pos_product_barcodes_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "app_pos_products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_unit_conversions" ADD CONSTRAINT "app_pos_product_unit_conversions_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "app_pos_products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_branch_prices" ADD CONSTRAINT "app_pos_product_branch_prices_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "app_pos_products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_branch_prices" ADD CONSTRAINT "app_pos_product_branch_prices_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_images" ADD CONSTRAINT "app_pos_product_images_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "app_pos_products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_stocks" ADD CONSTRAINT "app_pos_product_stocks_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "app_pos_products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_product_stocks" ADD CONSTRAINT "app_pos_product_stocks_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_purchases" ADD CONSTRAINT "app_pos_purchases_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_purchases" ADD CONSTRAINT "app_pos_purchases_supplier_uuid_fkey" FOREIGN KEY ("supplier_uuid") REFERENCES "app_pos_suppliers"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_purchases" ADD CONSTRAINT "app_pos_purchases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_purchase_items" ADD CONSTRAINT "app_pos_purchase_items_purchase_uuid_fkey" FOREIGN KEY ("purchase_uuid") REFERENCES "app_pos_purchases"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_purchase_items" ADD CONSTRAINT "app_pos_purchase_items_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "app_pos_products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_stock_movements" ADD CONSTRAINT "app_pos_stock_movements_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_stock_movements" ADD CONSTRAINT "app_pos_stock_movements_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "app_pos_products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_stock_movements" ADD CONSTRAINT "app_pos_stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_sales" ADD CONSTRAINT "app_pos_sales_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_sales" ADD CONSTRAINT "app_pos_sales_customer_uuid_fkey" FOREIGN KEY ("customer_uuid") REFERENCES "app_pos_customers"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_sales" ADD CONSTRAINT "app_pos_sales_payment_method_uuid_fkey" FOREIGN KEY ("payment_method_uuid") REFERENCES "app_pos_payment_methods"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_sales" ADD CONSTRAINT "app_pos_sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_sale_items" ADD CONSTRAINT "app_pos_sale_items_sale_uuid_fkey" FOREIGN KEY ("sale_uuid") REFERENCES "app_pos_sales"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_sale_items" ADD CONSTRAINT "app_pos_sale_items_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "app_pos_products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_ppob_transactions" ADD CONSTRAINT "app_pos_ppob_transactions_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_ppob_transactions" ADD CONSTRAINT "app_pos_ppob_transactions_payment_method_uuid_fkey" FOREIGN KEY ("payment_method_uuid") REFERENCES "app_pos_payment_methods"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_ppob_transactions" ADD CONSTRAINT "app_pos_ppob_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

