ALTER TABLE "app_pos_products"
ADD COLUMN "sku" VARCHAR(100) NOT NULL;

CREATE UNIQUE INDEX "app_pos_products_sku_key" ON "app_pos_products"("sku");
