-- CreateTable
CREATE TABLE "pos_product_units" (
    "uuid" CHAR(36) NOT NULL,
    "company_uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_product_units_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "pos_product_units_company_uuid_idx" ON "pos_product_units"("company_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "pos_product_units_company_uuid_name_key" ON "pos_product_units"("company_uuid", "name");

-- AddForeignKey
ALTER TABLE "pos_product_units" ADD CONSTRAINT "pos_product_units_company_uuid_fkey" FOREIGN KEY ("company_uuid") REFERENCES "companies"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
