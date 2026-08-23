-- RenameTable: app_pos_payment_methods menjadi konsep saldo (akun uang milik
-- konter, tidak cuma "cara customer bayar"). FK yang sudah ada dari
-- app_pos_sales & app_pos_ppob_transactions tetap valid otomatis -- Postgres
-- resolve foreign key lewat OID tabel, bukan nama, jadi rename tidak
-- memutus relasi yang sudah ada.
ALTER TABLE "app_pos_payment_methods" RENAME TO "app_pos_saldo_accounts";
ALTER TABLE "app_pos_saldo_accounts" RENAME CONSTRAINT "app_pos_payment_methods_pkey" TO "app_pos_saldo_accounts_pkey";
ALTER INDEX "app_pos_payment_methods_company_uuid_idx" RENAME TO "app_pos_saldo_accounts_company_uuid_idx";
ALTER INDEX "app_pos_payment_methods_company_uuid_code_key" RENAME TO "app_pos_saldo_accounts_company_uuid_code_key";

-- AlterTable: tambah kolom saldo (balance berjalan) + penanda apakah akun
-- ini boleh dipilih sebagai metode bayar customer.
ALTER TABLE "app_pos_saldo_accounts" ADD COLUMN     "balance" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "app_pos_saldo_accounts" ADD COLUMN     "is_payment_method" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "app_pos_saldo_mutations" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "saldo_account_uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36),
    "direction" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance_before" DECIMAL(15,2) NOT NULL,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "reference_type" VARCHAR(30) NOT NULL,
    "reference_uuid" CHAR(36),
    "notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_pos_saldo_mutations_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "app_pos_saldo_mutations_company_uuid_idx" ON "app_pos_saldo_mutations"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_saldo_mutations_saldo_account_uuid_idx" ON "app_pos_saldo_mutations"("saldo_account_uuid");

-- CreateIndex
CREATE INDEX "app_pos_saldo_mutations_branch_uuid_idx" ON "app_pos_saldo_mutations"("branch_uuid");

-- AddForeignKey
ALTER TABLE "app_pos_saldo_mutations" ADD CONSTRAINT "app_pos_saldo_mutations_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_mutations" ADD CONSTRAINT "app_pos_saldo_mutations_saldo_account_uuid_fkey" FOREIGN KEY ("saldo_account_uuid") REFERENCES "app_pos_saldo_accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_mutations" ADD CONSTRAINT "app_pos_saldo_mutations_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_mutations" ADD CONSTRAINT "app_pos_saldo_mutations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
