-- AlterTable: setting POS "boleh jual stok minus" per company
ALTER TABLE "companies" ADD COLUMN "allow_negative_stock" BOOLEAN NOT NULL DEFAULT false;
