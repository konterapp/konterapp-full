-- AlterTable
ALTER TABLE "subscription_invoices" ADD COLUMN     "admin_note" TEXT,
ADD COLUMN     "paid_by_administrator_id" INTEGER;

-- CreateIndex
CREATE INDEX "subscription_invoices_paid_by_administrator_id_idx" ON "subscription_invoices"("paid_by_administrator_id");