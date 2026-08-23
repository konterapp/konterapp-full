-- CreateTable: pembatasan cabang untuk user dengan role yang tidak punya
-- akses penuh ke cabang (tidak punya permission pos.branch.index). User
-- tanpa baris di sini sama sekali dianggap tidak dibatasi.
CREATE TABLE "company_user_branches" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "company_user_uuid" CHAR(36) NOT NULL,
    "branch_uuid" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_user_branches_pkey" PRIMARY KEY ("uuid")
);

CREATE UNIQUE INDEX "company_user_branches_company_user_uuid_branch_uuid_key" ON "company_user_branches"("company_user_uuid", "branch_uuid");

CREATE INDEX "company_user_branches_company_uuid_idx" ON "company_user_branches"("company_uuid");

CREATE INDEX "company_user_branches_branch_uuid_idx" ON "company_user_branches"("branch_uuid");

ALTER TABLE "company_user_branches" ADD CONSTRAINT "company_user_branches_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_user_branches" ADD CONSTRAINT "company_user_branches_company_user_uuid_fkey" FOREIGN KEY ("company_user_uuid") REFERENCES "company_users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_user_branches" ADD CONSTRAINT "company_user_branches_branch_uuid_fkey" FOREIGN KEY ("branch_uuid") REFERENCES "app_pos_branches"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
