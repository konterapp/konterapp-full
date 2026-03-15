-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `source_db` VARCHAR(50) NULL,
    `source_id` VARCHAR(50) NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL,

    UNIQUE INDEX `users_uuid_key`(`uuid`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_source_db_source_id_key`(`source_db`, `source_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `source_db` VARCHAR(50) NULL,
    `source_id` VARCHAR(50) NULL,
    `user_id` INTEGER NOT NULL,
    `user_type` TINYINT NULL,
    `admin_scope` VARCHAR(50) NULL,
    `country_id` INTEGER NULL,
    `province_id` INTEGER NULL,
    `city_id` INTEGER NULL,
    `district_id` INTEGER NULL,
    `village_id` INTEGER NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `avatar` TEXT NULL,
    `avatar_s3_sync` BOOLEAN NULL,
    `title` VARCHAR(255) NULL,
    `work_unit` VARCHAR(255) NULL,
    `company` VARCHAR(255) NULL,
    `phone_without_dc` VARCHAR(255) NULL,
    `dc` VARCHAR(255) NULL,
    `iso` VARCHAR(255) NULL,
    `fcm` TEXT NULL,
    `company_logo` TEXT NULL,
    `company_logo_s3_sync` BOOLEAN NULL,
    `description` TEXT NULL,
    `wilayah_kode` VARCHAR(20) NULL,

    UNIQUE INDEX `user_profiles_user_id_key`(`user_id`),
    INDEX `idx_user_profiles_country_id`(`country_id`),
    INDEX `idx_user_profiles_province_id`(`province_id`),
    INDEX `idx_user_profiles_city_id`(`city_id`),
    INDEX `idx_user_profiles_type_province`(`user_type`, `province_id`),
    INDEX `idx_user_profiles_province_type`(`province_id`, `user_type`),
    INDEX `user_profiles_admin_scope_idx`(`admin_scope`),
    INDEX `user_profiles_user_type_admin_scope_idx`(`user_type`, `admin_scope`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NOT NULL DEFAULT 'web',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_guard_name_key`(`name`, `guard_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NOT NULL DEFAULT 'web',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_name_guard_name_key`(`name`, `guard_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_has_roles` (
    `role_id` INTEGER NOT NULL,
    `model_type` VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User',
    `model_id` INTEGER NOT NULL,

    INDEX `model_has_roles_model_id_model_type_index`(`model_id`, `model_type`),
    PRIMARY KEY (`role_id`, `model_type`, `model_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_has_permissions` (
    `permission_id` INTEGER NOT NULL,
    `model_type` VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User',
    `model_id` INTEGER NOT NULL,

    INDEX `model_has_permissions_model_id_model_type_index`(`model_id`, `model_type`),
    PRIMARY KEY (`permission_id`, `model_type`, `model_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_has_permissions` (
    `permission_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,

    PRIMARY KEY (`permission_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `model_has_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
