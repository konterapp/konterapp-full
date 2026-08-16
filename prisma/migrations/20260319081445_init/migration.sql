-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "source_db" VARCHAR(50),
    "source_id" VARCHAR(50),
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
CREATE TABLE "user_profiles" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "source_db" VARCHAR(50),
    "source_id" VARCHAR(50),
    "user_id" INTEGER NOT NULL,
    "user_type" SMALLINT,
    "admin_scope" VARCHAR(50),
    "country_id" INTEGER,
    "province_id" INTEGER,
    "city_id" INTEGER,
    "district_id" INTEGER,
    "village_id" INTEGER,
    "phone" VARCHAR(20),
    "address" TEXT,
    "avatar" TEXT,
    "avatar_s3_sync" BOOLEAN,
    "title" VARCHAR(255),
    "work_unit" VARCHAR(255),
    "company" VARCHAR(255),
    "phone_without_dc" VARCHAR(255),
    "dc" VARCHAR(255),
    "iso" VARCHAR(255),
    "fcm" TEXT,
    "company_logo" TEXT,
    "company_logo_s3_sync" BOOLEAN,
    "description" TEXT,
    "wilayah_kode" VARCHAR(20),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "guard_name" VARCHAR(255) NOT NULL DEFAULT 'web',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "guard_name" VARCHAR(255) NOT NULL DEFAULT 'web',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_has_roles" (
    "role_id" INTEGER NOT NULL,
    "model_type" VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User',
    "model_id" INTEGER NOT NULL,

    CONSTRAINT "model_has_roles_pkey" PRIMARY KEY ("role_id","model_type","model_id")
);

-- CreateTable
CREATE TABLE "model_has_permissions" (
    "permission_id" INTEGER NOT NULL,
    "model_type" VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User',
    "model_id" INTEGER NOT NULL,

    CONSTRAINT "model_has_permissions_pkey" PRIMARY KEY ("permission_id","model_type","model_id")
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
CREATE TABLE "role_has_permissions" (
    "permission_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "role_has_permissions_pkey" PRIMARY KEY ("permission_id","role_id")
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
CREATE UNIQUE INDEX "users_source_db_source_id_key" ON "users"("source_db", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_profiles_country_id" ON "user_profiles"("country_id");

-- CreateIndex
CREATE INDEX "idx_user_profiles_province_id" ON "user_profiles"("province_id");

-- CreateIndex
CREATE INDEX "idx_user_profiles_city_id" ON "user_profiles"("city_id");

-- CreateIndex
CREATE INDEX "idx_user_profiles_type_province" ON "user_profiles"("user_type", "province_id");

-- CreateIndex
CREATE INDEX "idx_user_profiles_province_type" ON "user_profiles"("province_id", "user_type");

-- CreateIndex
CREATE INDEX "user_profiles_admin_scope_idx" ON "user_profiles"("admin_scope");

-- CreateIndex
CREATE INDEX "user_profiles_user_type_admin_scope_idx" ON "user_profiles"("user_type", "admin_scope");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_guard_name_key" ON "roles"("name", "guard_name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_guard_name_key" ON "permissions"("name", "guard_name");

-- CreateIndex
CREATE INDEX "model_has_roles_model_id_model_type_index" ON "model_has_roles"("model_id", "model_type");

-- CreateIndex
CREATE INDEX "model_has_permissions_model_id_model_type_index" ON "model_has_permissions"("model_id", "model_type");

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
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_has_roles" ADD CONSTRAINT "model_has_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_has_roles" ADD CONSTRAINT "model_has_roles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_has_permissions" ADD CONSTRAINT "model_has_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "berita" ADD CONSTRAINT "berita_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
