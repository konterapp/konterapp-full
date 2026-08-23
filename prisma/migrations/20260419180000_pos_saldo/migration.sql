-- RenameTable: app_pos_payment_methods menjadi konsep saldo (akun uang milik
-- konter, tidak cuma "cara customer bayar"). FK yang sudah ada dari
-- app_pos_sales & app_pos_ppob_transactions tetap valid otomatis -- Postgres
-- resolve foreign key lewat OID tabel, bukan nama, jadi rename tidak
-- memutus relasi yang sudah ada.
ALTER TABLE "app_pos_payment_methods" RENAME TO "app_pos_saldo_accounts";
ALTER TABLE "app_pos_saldo_accounts" RENAME CONSTRAINT "app_pos_payment_methods_pkey" TO "app_pos_saldo_accounts_pkey";
ALTER INDEX "app_pos_payment_methods_company_uuid_idx" RENAME TO "app_pos_saldo_accounts_company_uuid_idx";
ALTER INDEX "app_pos_payment_methods_company_uuid_code_key" RENAME TO "app_pos_saldo_accounts_company_uuid_code_key";

-- AlterTable: penanda apakah akun ini boleh dipilih sebagai metode bayar
-- customer. Balance TIDAK lagi menempel di akun induk -- pindah ke level
-- baris AppPosSaldoAccountBalance (per kelompok cabang) di bawah.
ALTER TABLE "app_pos_saldo_accounts" ADD COLUMN     "is_payment_method" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: account_number/account_name (warisan dari app_pos_payment_methods
-- lewat rename di atas) pindah ke level baris balance per kelompok cabang --
-- 1 akun induk bisa punya beberapa grup dengan nomor rekening berbeda-beda.
ALTER TABLE "app_pos_saldo_accounts" DROP COLUMN "account_number";
ALTER TABLE "app_pos_saldo_accounts" DROP COLUMN "account_name";

-- CreateTable: baris balance per kelompok cabang (1 angka dipakai bareng
-- oleh sekumpulan cabang; akun induk bisa punya banyak baris di sini).
CREATE TABLE "app_pos_saldo_account_balances" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "saldo_account_uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(100),
    "account_number" VARCHAR(100),
    "account_name" VARCHAR(100),
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_saldo_account_balances_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable: pivot cabang <-> baris balance. Unique (saldo_account, branch)
-- menjamin 1 cabang cuma masuk 1 kelompok balance untuk akun induk yang sama.
CREATE TABLE "app_pos_saldo_account_balance_branches" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "saldo_account_uuid" CHAR(36) NOT NULL,
    "saldo_account_balance_uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_pos_saldo_account_balance_branches_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "app_pos_saldo_mutations" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "saldo_account_balance_uuid" CHAR(36) NOT NULL,
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
CREATE INDEX "app_pos_saldo_account_balances_company_uuid_idx" ON "app_pos_saldo_account_balances"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_saldo_account_balances_saldo_account_uuid_idx" ON "app_pos_saldo_account_balances"("saldo_account_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_saldo_account_balance_branches_saldo_account_uuid_branch_uuid_key" ON "app_pos_saldo_account_balance_branches"("saldo_account_uuid", "branch_uuid");

-- CreateIndex
CREATE INDEX "app_pos_saldo_account_balance_branches_branch_uuid_idx" ON "app_pos_saldo_account_balance_branches"("branch_uuid");

-- CreateIndex
CREATE INDEX "app_pos_saldo_account_balance_branches_company_uuid_idx" ON "app_pos_saldo_account_balance_branches"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_saldo_mutations_company_uuid_idx" ON "app_pos_saldo_mutations"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_saldo_mutations_saldo_account_balance_uuid_idx" ON "app_pos_saldo_mutations"("saldo_account_balance_uuid");

-- CreateIndex
CREATE INDEX "app_pos_saldo_mutations_branch_uuid_idx" ON "app_pos_saldo_mutations"("branch_uuid");

-- AddForeignKey
ALTER TABLE "app_pos_saldo_account_balances" ADD CONSTRAINT "app_pos_saldo_account_balances_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_account_balances" ADD CONSTRAINT "app_pos_saldo_account_balances_saldo_account_uuid_fkey" FOREIGN KEY ("saldo_account_uuid") REFERENCES "app_pos_saldo_accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_account_balance_branches" ADD CONSTRAINT "app_pos_saldo_account_balance_branches_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_account_balance_branches" ADD CONSTRAINT "app_pos_saldo_account_balance_branches_saldo_account_uuid_fkey" FOREIGN KEY ("saldo_account_uuid") REFERENCES "app_pos_saldo_accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_account_balance_branches" ADD CONSTRAINT "app_pos_saldo_account_balance_branches_saldo_account_balance_uuid_fkey" FOREIGN KEY ("saldo_account_balance_uuid") REFERENCES "app_pos_saldo_account_balances"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_account_balance_branches" ADD CONSTRAINT "app_pos_saldo_account_balance_branches_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_mutations" ADD CONSTRAINT "app_pos_saldo_mutations_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_mutations" ADD CONSTRAINT "app_pos_saldo_mutations_saldo_account_balance_uuid_fkey" FOREIGN KEY ("saldo_account_balance_uuid") REFERENCES "app_pos_saldo_account_balances"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_mutations" ADD CONSTRAINT "app_pos_saldo_mutations_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_saldo_mutations" ADD CONSTRAINT "app_pos_saldo_mutations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
