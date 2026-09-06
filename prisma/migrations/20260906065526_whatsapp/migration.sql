-- DropIndex
DROP INDEX "app_pos_product_units_company_uuid_name_key";

-- AlterTable
ALTER TABLE "app_model_has_roles" ALTER COLUMN "model_type" SET DEFAULT 'App\Models\User';

-- AlterTable
ALTER TABLE "plan_tiers" ALTER COLUMN "features" DROP NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "app_whatsapp_sessions" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'disconnected',
    "phone_number" VARCHAR(20),
    "last_error" TEXT,
    "last_connected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_whatsapp_sessions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_whatsapp_notification_settings" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "target_phone" VARCHAR(20),
    "threshold" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_whatsapp_notification_settings_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_whatsapp_messages" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "recipient_phone" VARCHAR(20) NOT NULL,
    "text" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "dedup_key" VARCHAR(100),
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_whatsapp_messages_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_whatsapp_sessions_company_uuid_key" ON "app_whatsapp_sessions"("company_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_whatsapp_notification_settings_company_uuid_type_key" ON "app_whatsapp_notification_settings"("company_uuid", "type");

-- CreateIndex
CREATE UNIQUE INDEX "app_whatsapp_messages_dedup_key_key" ON "app_whatsapp_messages"("dedup_key");

-- CreateIndex
CREATE INDEX "app_whatsapp_messages_company_uuid_status_idx" ON "app_whatsapp_messages"("company_uuid", "status");

-- RenameForeignKey
ALTER TABLE "app_pos_cashier_shift_saldo_snapshots" RENAME CONSTRAINT "app_pos_cashier_shift_saldo_snapshots_saldo_account_balance_uui" TO "app_pos_cashier_shift_saldo_snapshots_saldo_account_balanc_fkey";

-- RenameForeignKey
ALTER TABLE "app_pos_saldo_account_balance_branches" RENAME CONSTRAINT "app_pos_saldo_account_balance_branches_saldo_account_balance_uu" TO "app_pos_saldo_account_balance_branches_saldo_account_balan_fkey";

-- RenameForeignKey
ALTER TABLE "app_pos_saldo_accounts" RENAME CONSTRAINT "app_pos_payment_methods_company_uuid_fkey" TO "app_pos_saldo_accounts_company_uuid_fkey";

-- AddForeignKey
ALTER TABLE "app_whatsapp_sessions" ADD CONSTRAINT "app_whatsapp_sessions_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_whatsapp_notification_settings" ADD CONSTRAINT "app_whatsapp_notification_settings_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_whatsapp_messages" ADD CONSTRAINT "app_whatsapp_messages_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "app_model_has_roles_model_id_model_type_index" RENAME TO "app_model_has_roles_model_id_model_type_idx";

-- RenameIndex
ALTER INDEX "app_pos_cashier_shift_saldo_snapshots_shift_uuid_phase_bal_key" RENAME TO "app_pos_cashier_shift_saldo_snapshots_shift_uuid_phase_sald_key";

-- RenameIndex
ALTER INDEX "app_pos_saldo_account_balance_branches_saldo_account_uuid_branc" RENAME TO "app_pos_saldo_account_balance_branches_saldo_account_uuid_b_key";

-- RenameIndex
ALTER INDEX "roles_company_uuid_name_key" RENAME TO "app_roles_company_uuid_name_key";
