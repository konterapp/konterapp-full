import { z } from "zod";

export const createProductSchema = z.object({
  category_uuid: z.string({ error: "Kategori wajib diisi" }).min(1, "Kategori wajib diisi"),
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  sku: z.string({ error: "SKU wajib diisi" }).min(1, "SKU wajib diisi").max(255, "SKU maksimal 255 karakter"),
  description: z.string().optional().nullable().or(z.literal("")),
  barcode: z.string().optional().nullable().or(z.literal("")),
  selling_price: z.number({ error: "Harga jual wajib diisi" }).min(0, "Harga jual minimal 0"),
  min_selling_price: z.number().min(0, "Harga jual minimum minimal 0").optional().nullable(),
  min_stock: z.number().min(0, "Minimal stok minimal 0").optional().nullable(),
  unit: z.string().max(20, "Satuan maksimal 20 karakter").optional().nullable().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  category_uuid: z.string().optional(),
  name: z.string().min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter").optional(),
  sku: z.string().min(1, "SKU wajib diisi").max(255, "SKU maksimal 255 karakter").optional(),
  description: z.string().optional().nullable().or(z.literal("")),
  barcode: z.string().optional().nullable().or(z.literal("")),
  selling_price: z.number().min(0, "Harga jual minimal 0").optional(),
  min_selling_price: z.number().min(0, "Harga jual minimum minimal 0").optional().nullable(),
  min_stock: z.number().min(0, "Minimal stok minimal 0").optional().nullable(),
  unit: z.string().max(20, "Satuan maksimal 20 karakter").optional().nullable().or(z.literal("")),
  is_active: z.boolean().optional(),
});
