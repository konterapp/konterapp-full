import { z } from "zod";

const additionalBarcodeSchema = z
  .string()
  .min(1, "Barcode tambahan tidak boleh kosong")
  .max(100, "Barcode tambahan maksimal 100 karakter");

const unitConversionSchema = z.object({
  unit: z.string().min(1, "Satuan wajib diisi").max(20, "Satuan maksimal 20 karakter"),
  factor_to_base: z.number().positive("Faktor ke base harus lebih dari 0"),
  is_active: z.boolean().optional(),
});

const branchPriceSchema = z.object({
  branch_uuid: z.string().min(1, "Cabang wajib diisi"),
  selling_price: z.number().min(0, "Harga jual cabang minimal 0"),
  wholesale_price: z.number().min(0, "Harga grosir cabang minimal 0"),
});

export const createProductSchema = z.object({
  category_uuid: z.string({ error: "Kategori wajib diisi" }).min(1, "Kategori wajib diisi"),
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  sku: z.string({ error: "SKU wajib diisi" }).min(1, "SKU wajib diisi").max(255, "SKU maksimal 255 karakter"),
  barcode: z.string().optional().nullable().or(z.literal("")),
  additional_barcodes: z.array(additionalBarcodeSchema).optional(),
  purchase_price: z.number().min(0, "Harga beli minimal 0").optional(),
  selling_price: z.number({ error: "Harga jual wajib diisi" }).min(0, "Harga jual minimal 0"),
  wholesale_price: z.number().min(0, "Harga grosir minimal 0").optional(),
  min_stock: z.number().min(0, "Minimal stok minimal 0").optional().nullable(),
  unit: z.string().max(20, "Satuan maksimal 20 karakter").optional().nullable().or(z.literal("")),
  unit_conversions: z.array(unitConversionSchema).optional(),
  branch_prices: z.array(branchPriceSchema).optional(),
  is_active: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  category_uuid: z.string().optional(),
  name: z.string().min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter").optional(),
  sku: z.string().min(1, "SKU wajib diisi").max(255, "SKU maksimal 255 karakter").optional(),
  barcode: z.string().optional().nullable().or(z.literal("")),
  additional_barcodes: z.array(additionalBarcodeSchema).optional(),
  purchase_price: z.number().min(0, "Harga beli minimal 0").optional(),
  selling_price: z.number().min(0, "Harga jual minimal 0").optional(),
  wholesale_price: z.number().min(0, "Harga grosir minimal 0").optional(),
  min_stock: z.number().min(0, "Minimal stok minimal 0").optional().nullable(),
  unit: z.string().max(20, "Satuan maksimal 20 karakter").optional().nullable().or(z.literal("")),
  unit_conversions: z.array(unitConversionSchema).optional(),
  branch_prices: z.array(branchPriceSchema).optional(),
  is_active: z.boolean().optional(),
});
