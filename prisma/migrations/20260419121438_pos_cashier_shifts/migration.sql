-- CreateTable
CREATE TABLE "app_pos_cashier_shifts" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "opened_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "total_sales" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes_open" TEXT,
    "notes_close" TEXT,
    "opening_saldo_snapshot" JSONB,
    "closing_saldo_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pos_cashier_shifts_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "app_pos_cashier_shifts_company_uuid_idx" ON "app_pos_cashier_shifts"("company_uuid");

-- CreateIndex
CREATE INDEX "app_pos_cashier_shifts_branch_uuid_idx" ON "app_pos_cashier_shifts"("branch_uuid");

-- CreateIndex
CREATE INDEX "app_pos_cashier_shifts_user_id_idx" ON "app_pos_cashier_shifts"("user_id");

-- CreateIndex
CREATE INDEX "app_pos_cashier_shifts_status_idx" ON "app_pos_cashier_shifts"("status");

-- CreateIndex
CREATE INDEX "app_pos_cashier_shifts_opened_at_idx" ON "app_pos_cashier_shifts"("opened_at");

-- CreateIndex
CREATE UNIQUE INDEX "app_pos_cashier_shifts_one_open_per_user_company" ON "app_pos_cashier_shifts"("company_uuid", "user_id") WHERE status = 'open';

-- AddForeignKey
ALTER TABLE "app_pos_cashier_shifts" ADD CONSTRAINT "app_pos_cashier_shifts_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_cashier_shifts" ADD CONSTRAINT "app_pos_cashier_shifts_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_pos_cashier_shifts" ADD CONSTRAINT "app_pos_cashier_shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
