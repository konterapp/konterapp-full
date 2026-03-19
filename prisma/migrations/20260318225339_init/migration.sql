-- AlterTable
ALTER TABLE `model_has_permissions` MODIFY `model_type` VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User';

-- AlterTable
ALTER TABLE `model_has_roles` MODIFY `model_type` VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User';

-- CreateTable
CREATE TABLE `pos_product_categories` (
    `uuid` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_branches` (
    `uuid` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_main` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_branches_code_key`(`code`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_products` (
    `uuid` CHAR(36) NOT NULL,
    `category_uuid` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `barcode` VARCHAR(100) NULL,
    `selling_price` DECIMAL(15, 2) NOT NULL,
    `min_selling_price` DECIMAL(15, 2) NULL,
    `min_stock` INTEGER NOT NULL DEFAULT 0,
    `unit` VARCHAR(20) NOT NULL DEFAULT 'pcs',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `image` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_products_sku_key`(`sku`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_product_stocks` (
    `uuid` CHAR(36) NOT NULL,
    `product_uuid` CHAR(36) NOT NULL,
    `branch_uuid` CHAR(36) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_product_stocks_product_uuid_branch_uuid_key`(`product_uuid`, `branch_uuid`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_product_images` (
    `uuid` CHAR(36) NOT NULL,
    `product_uuid` CHAR(36) NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pos_product_images_product_uuid_idx`(`product_uuid`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_suppliers` (
    `uuid` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `contact_person` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_suppliers_code_key`(`code`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_purchases` (
    `uuid` CHAR(36) NOT NULL,
    `purchase_number` VARCHAR(50) NOT NULL,
    `branch_uuid` CHAR(36) NOT NULL,
    `supplier_uuid` CHAR(36) NOT NULL,
    `purchase_date` DATE NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_purchases_purchase_number_key`(`purchase_number`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_purchase_items` (
    `uuid` CHAR(36) NOT NULL,
    `purchase_uuid` CHAR(36) NOT NULL,
    `product_uuid` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_stock_movements` (
    `uuid` CHAR(36) NOT NULL,
    `branch_uuid` CHAR(36) NOT NULL,
    `product_uuid` CHAR(36) NOT NULL,
    `movement_type` VARCHAR(20) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `previous_stock` INTEGER NOT NULL,
    `new_stock` INTEGER NOT NULL,
    `reference_type` VARCHAR(50) NULL,
    `reference_uuid` CHAR(36) NULL,
    `notes` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pos_stock_movements_branch_uuid_idx`(`branch_uuid`),
    INDEX `pos_stock_movements_product_uuid_idx`(`product_uuid`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_payment_methods` (
    `uuid` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'cash',
    `account_number` VARCHAR(100) NULL,
    `account_name` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_payment_methods_code_key`(`code`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_customers` (
    `uuid` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pos_customers_phone_idx`(`phone`),
    INDEX `pos_customers_name_idx`(`name`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_sales` (
    `uuid` CHAR(36) NOT NULL,
    `sale_number` VARCHAR(50) NOT NULL,
    `branch_uuid` CHAR(36) NOT NULL,
    `customer_uuid` CHAR(36) NULL,
    `payment_method_uuid` CHAR(36) NOT NULL,
    `sale_date` DATE NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `change_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `payment_status` VARCHAR(20) NOT NULL DEFAULT 'paid',
    `notes` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_sales_sale_number_key`(`sale_number`),
    INDEX `pos_sales_sale_date_idx`(`sale_date`),
    INDEX `pos_sales_payment_status_idx`(`payment_status`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_sale_items` (
    `uuid` CHAR(36) NOT NULL,
    `sale_uuid` CHAR(36) NOT NULL,
    `product_uuid` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_ppob_products` (
    `uuid` CHAR(36) NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `provider_product_code` VARCHAR(100) NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `brand` VARCHAR(100) NULL,
    `category` VARCHAR(50) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `seller_name` VARCHAR(255) NULL,
    `base_price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `admin_fee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `selling_price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `digiflazz_type` VARCHAR(50) NULL,
    `buyer_product_status` BOOLEAN NOT NULL DEFAULT true,
    `seller_product_status` BOOLEAN NOT NULL DEFAULT true,
    `unlimited_stock` BOOLEAN NOT NULL DEFAULT false,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `multi` BOOLEAN NOT NULL DEFAULT false,
    `start_cut_off` VARCHAR(10) NULL,
    `end_cut_off` VARCHAR(10) NULL,
    `desc` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `provider_metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pos_ppob_products_category_idx`(`category`),
    INDEX `pos_ppob_products_brand_idx`(`brand`),
    INDEX `pos_ppob_products_is_active_idx`(`is_active`),
    UNIQUE INDEX `pos_ppob_products_provider_provider_product_code_key`(`provider`, `provider_product_code`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pos_ppob_transactions` (
    `uuid` CHAR(36) NOT NULL,
    `branch_uuid` CHAR(36) NOT NULL,
    `transaction_number` VARCHAR(50) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `product_code` VARCHAR(100) NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `customer_number` VARCHAR(100) NOT NULL,
    `customer_name` VARCHAR(255) NULL,
    `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `admin_fee` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `selling_price` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `profit` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `payment_method_uuid` CHAR(36) NULL,
    `provider_reference` VARCHAR(255) NULL,
    `provider` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `provider_response` JSON NULL,
    `notes` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pos_ppob_transactions_transaction_number_key`(`transaction_number`),
    INDEX `pos_ppob_transactions_branch_uuid_idx`(`branch_uuid`),
    INDEX `pos_ppob_transactions_status_idx`(`status`),
    INDEX `pos_ppob_transactions_created_at_idx`(`created_at`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pos_products` ADD CONSTRAINT `pos_products_category_uuid_fkey` FOREIGN KEY (`category_uuid`) REFERENCES `pos_product_categories`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_product_stocks` ADD CONSTRAINT `pos_product_stocks_product_uuid_fkey` FOREIGN KEY (`product_uuid`) REFERENCES `pos_products`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_product_stocks` ADD CONSTRAINT `pos_product_stocks_branch_uuid_fkey` FOREIGN KEY (`branch_uuid`) REFERENCES `pos_branches`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_product_images` ADD CONSTRAINT `pos_product_images_product_uuid_fkey` FOREIGN KEY (`product_uuid`) REFERENCES `pos_products`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_purchases` ADD CONSTRAINT `pos_purchases_branch_uuid_fkey` FOREIGN KEY (`branch_uuid`) REFERENCES `pos_branches`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_purchases` ADD CONSTRAINT `pos_purchases_supplier_uuid_fkey` FOREIGN KEY (`supplier_uuid`) REFERENCES `pos_suppliers`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_purchases` ADD CONSTRAINT `pos_purchases_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_purchase_items` ADD CONSTRAINT `pos_purchase_items_purchase_uuid_fkey` FOREIGN KEY (`purchase_uuid`) REFERENCES `pos_purchases`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_purchase_items` ADD CONSTRAINT `pos_purchase_items_product_uuid_fkey` FOREIGN KEY (`product_uuid`) REFERENCES `pos_products`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_stock_movements` ADD CONSTRAINT `pos_stock_movements_branch_uuid_fkey` FOREIGN KEY (`branch_uuid`) REFERENCES `pos_branches`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_stock_movements` ADD CONSTRAINT `pos_stock_movements_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_sales` ADD CONSTRAINT `pos_sales_branch_uuid_fkey` FOREIGN KEY (`branch_uuid`) REFERENCES `pos_branches`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_sales` ADD CONSTRAINT `pos_sales_customer_uuid_fkey` FOREIGN KEY (`customer_uuid`) REFERENCES `pos_customers`(`uuid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_sales` ADD CONSTRAINT `pos_sales_payment_method_uuid_fkey` FOREIGN KEY (`payment_method_uuid`) REFERENCES `pos_payment_methods`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_sales` ADD CONSTRAINT `pos_sales_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_sale_items` ADD CONSTRAINT `pos_sale_items_sale_uuid_fkey` FOREIGN KEY (`sale_uuid`) REFERENCES `pos_sales`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_sale_items` ADD CONSTRAINT `pos_sale_items_product_uuid_fkey` FOREIGN KEY (`product_uuid`) REFERENCES `pos_products`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_ppob_transactions` ADD CONSTRAINT `pos_ppob_transactions_branch_uuid_fkey` FOREIGN KEY (`branch_uuid`) REFERENCES `pos_branches`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_ppob_transactions` ADD CONSTRAINT `pos_ppob_transactions_payment_method_uuid_fkey` FOREIGN KEY (`payment_method_uuid`) REFERENCES `pos_payment_methods`(`uuid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pos_ppob_transactions` ADD CONSTRAINT `pos_ppob_transactions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
