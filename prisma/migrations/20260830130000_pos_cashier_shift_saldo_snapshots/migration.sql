-- CreateTable: snapshot saldo per akun pada saat buka/tutup shift, dulunya
-- dititip di kolom JSON app_pos_cashier_shifts.opening_saldo_snapshot /
-- closing_saldo_snapshot -- dipindah ke tabel terpisah supaya bisa
-- di-index & diagregasi buat laporan Selisih lintas shift/cabang.
CREATE TABLE "app_pos_cashier_shift_saldo_snapshots" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "shift_uuid" CHAR(36) NOT NULL,
    "phase" VARCHAR(10) NOT NULL,
    "saldo_account_uuid" CHAR(36) NOT NULL,
    "saldo_account_balance_uuid" CHAR(36) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "actual_balance" DECIMAL(15,2),
    "variance" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_pos_cashier_shift_saldo_snapshots_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_cashier_shift_saldo_snapshots_shift_uuid_phase_bal_key" ON "app_pos_cashier_shift_saldo_snapshots"("shift_uuid", "phase", "saldo_account_balance_uuid");

-- CreateIndex
CREATE INDEX "app_pos_cashier_shift_saldo_snapshots_company_uuid_idx" ON "app_pos_cashier_shift_saldo_snapshots"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_cashier_shift_saldo_snapshots_shift_uuid_idx" ON "app_pos_cashier_shift_saldo_snapshots"("shift_uuid");

-- CreateIndex
CREATE INDEX "app_pos_cashier_shift_saldo_snapshots_saldo_account_uuid_idx" ON "app_pos_cashier_shift_saldo_snapshots"("saldo_account_uuid");

-- AddForeignKey
ALTER TABLE "app_pos_cashier_shift_saldo_snapshots" ADD CONSTRAINT "app_pos_cashier_shift_saldo_snapshots_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_cashier_shift_saldo_snapshots" ADD CONSTRAINT "app_pos_cashier_shift_saldo_snapshots_shift_uuid_fkey" FOREIGN KEY ("shift_uuid") REFERENCES "app_pos_cashier_shifts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_cashier_shift_saldo_snapshots" ADD CONSTRAINT "app_pos_cashier_shift_saldo_snapshots_saldo_account_uuid_fkey" FOREIGN KEY ("saldo_account_uuid") REFERENCES "app_pos_saldo_accounts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_cashier_shift_saldo_snapshots" ADD CONSTRAINT "app_pos_cashier_shift_saldo_snapshots_saldo_account_balance_uuid_fkey" FOREIGN KEY ("saldo_account_balance_uuid") REFERENCES "app_pos_saldo_account_balances"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
