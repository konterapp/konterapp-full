-- AlterTable
ALTER TABLE `model_has_permissions` MODIFY `model_type` VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User';

-- AlterTable
ALTER TABLE `model_has_roles` MODIFY `model_type` VARCHAR(255) NOT NULL DEFAULT 'App\\Models\\User';

-- CreateTable
CREATE TABLE `berita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `image` VARCHAR(255) NULL,
    `tags` JSON NULL,
    `published_at` DATE NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `is_draft` BOOLEAN NOT NULL DEFAULT false,
    `news_type` VARCHAR(50) NULL,
    `category` VARCHAR(50) NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `berita_uuid_key`(`uuid`),
    UNIQUE INDEX `berita_slug_key`(`slug`),
    INDEX `berita_slug_idx`(`slug`),
    INDEX `berita_is_published_idx`(`is_published`),
    INDEX `berita_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `berita` ADD CONSTRAINT `berita_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
