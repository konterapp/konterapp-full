-- AlterTable: akun saldo mana pun (bukan berdasar `type`) bisa ditandai
-- boleh dipakai buat transaksi Agen Bank.
ALTER TABLE "app_pos_saldo_accounts" ADD COLUMN     "is_bank_agent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: jenis transaksi Agen Bank -- master data dinamis per company
-- (bukan hardcode), pola sama dengan app_pos_ppob_transaction_types.
CREATE TABLE "app_pos_bank_agent_transaction_types" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "cash_direction" VARCHAR(10) NOT NULL DEFAULT 'out',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_bank_agent_transaction_types_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_bank_agent_transaction_types_company_uuid_name_key" ON "app_pos_bank_agent_transaction_types"("company_uuid", "name");

-- CreateIndex
CREATE INDEX "app_pos_bank_agent_transaction_types_company_uuid_idx" ON "app_pos_bank_agent_transaction_types"("company_uuid");

-- AddForeignKey
ALTER TABLE "app_pos_bank_agent_transaction_types" ADD CONSTRAINT "app_pos_bank_agent_transaction_types_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "app_pos_bank_agent_transactions" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "saldo_account_uuid" CHAR(36) NOT NULL,
    "saldo_account_balance_uuid" CHAR(36) NOT NULL,
    "transaction_type_uuid" CHAR(36) NOT NULL,
    "transaction_number" VARCHAR(50) NOT NULL,
    "cash_direction" VARCHAR(10) NOT NULL,
    "account_reference" VARCHAR(100),
    "base_amount" DECIMAL(15,2) NOT NULL,
    "selling_amount" DECIMAL(15,2) NOT NULL,
    "fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "admin_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fee_received_via" VARCHAR(20),
    "payment_method_uuid" CHAR(36) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "change_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_bank_agent_transactions_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_bank_agent_transactions_transaction_number_key" ON "app_pos_bank_agent_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "app_pos_bank_agent_transactions_company_uuid_idx" ON "app_pos_bank_agent_transactions"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_bank_agent_transactions_branch_uuid_idx" ON "app_pos_bank_agent_transactions"("branch_uuid");

-- CreateIndex
CREATE INDEX "app_pos_bank_agent_transactions_saldo_account_uuid_idx" ON "app_pos_bank_agent_transactions"("saldo_account_uuid");

-- CreateIndex
CREATE INDEX "app_pos_bank_agent_transactions_payment_method_uuid_idx" ON "app_pos_bank_agent_transactions"("payment_method_uuid");

-- CreateIndex
CREATE INDEX "app_pos_bank_agent_transactions_transaction_type_uuid_idx" ON "app_pos_bank_agent_transactions"("transaction_type_uuid");

-- AddForeignKey
ALTER TABLE "app_pos_bank_agent_transactions" ADD CONSTRAINT "app_pos_bank_agent_transactions_transaction_type_uuid_fkey" FOREIGN KEY ("transaction_type_uuid") REFERENCES "app_pos_bank_agent_transaction_types"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_bank_agent_transactions" ADD CONSTRAINT "app_pos_bank_agent_transactions_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_bank_agent_transactions" ADD CONSTRAINT "app_pos_bank_agent_transactions_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_bank_agent_transactions" ADD CONSTRAINT "app_pos_bank_agent_transactions_saldo_account_uuid_fkey" FOREIGN KEY ("saldo_account_uuid") REFERENCES "app_pos_saldo_accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_bank_agent_transactions" ADD CONSTRAINT "app_pos_bank_agent_transactions_saldo_account_balance_uuid_fkey" FOREIGN KEY ("saldo_account_balance_uuid") REFERENCES "app_pos_saldo_account_balances"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_bank_agent_transactions" ADD CONSTRAINT "app_pos_bank_agent_transactions_payment_method_uuid_fkey" FOREIGN KEY ("payment_method_uuid") REFERENCES "app_pos_saldo_accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_bank_agent_transactions" ADD CONSTRAINT "app_pos_bank_agent_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: app_pos_sales.bank_agent_transaction_uuid ditambahkan di
-- migration init (kolomnya duluan), tapi FK-nya baru bisa dipasang di sini
-- karena tabel app_pos_bank_agent_transactions belum ada saat migration init
-- dijalankan.
ALTER TABLE "app_pos_sales" ADD CONSTRAINT "app_pos_sales_bank_agent_transaction_uuid_fkey" FOREIGN KEY ("bank_agent_transaction_uuid") REFERENCES "app_pos_bank_agent_transactions"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
