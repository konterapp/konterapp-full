ALTER TABLE "pos_products"
ADD COLUMN "sku" VARCHAR(100) NOT NULL;

CREATE UNIQUE INDEX "pos_products_sku_key" ON "pos_products"("sku");
