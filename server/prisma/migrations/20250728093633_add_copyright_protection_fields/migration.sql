-- AlterTable
ALTER TABLE `comments` ADD COLUMN `parent_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `posts` ADD COLUMN `allow_download` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `copyright_owner_id` INTEGER NULL,
    ADD COLUMN `copyright_year` INTEGER NULL,
    ADD COLUMN `download_protected` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `license_description` TEXT NULL,
    ADD COLUMN `license_type` VARCHAR(50) NULL,
    ADD COLUMN `watermark_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `watermark_position` VARCHAR(20) NULL,
    ADD COLUMN `watermark_text` VARCHAR(100) NULL;

-- CreateIndex
CREATE INDEX `comments_parent_id_idx` ON `comments`(`parent_id`);

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
