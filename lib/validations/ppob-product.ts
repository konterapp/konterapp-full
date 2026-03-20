import { z } from 'zod';

const providerEnum = z.enum(['rajabiller', 'digiflazz']);
const typeEnum = z.enum(['prepaid', 'postpaid']);

export const createPpobProductSchema = z.object({
  provider: providerEnum,
  provider_product_code: z.string({ error: 'Kode produk provider wajib diisi' }).min(1, 'Kode produk provider wajib diisi').max(100),
  product_name: z.string({ error: 'Nama produk wajib diisi' }).min(1, 'Nama produk wajib diisi').max(255),
  category: z.string({ error: 'Kategori wajib diisi' }).min(1, 'Kategori wajib diisi').max(50),
  type: typeEnum,
  base_price: z.number({ error: 'Harga dasar wajib diisi' }).min(0, 'Harga dasar minimal 0'),
  admin_fee: z.number().min(0, 'Biaya admin minimal 0').optional(),
  selling_price: z.number({ error: 'Harga jual wajib diisi' }).min(0, 'Harga jual minimal 0'),
  is_active: z.boolean().optional(),
});

export const updatePpobProductSchema = z.object({
  provider: providerEnum.optional(),
  provider_product_code: z.string().min(1, 'Kode produk provider wajib diisi').max(100).optional(),
  product_name: z.string().min(1, 'Nama produk wajib diisi').max(255).optional(),
  category: z.string().min(1, 'Kategori wajib diisi').max(50).optional(),
  type: typeEnum.optional(),
  base_price: z.number().min(0, 'Harga dasar minimal 0').optional(),
  admin_fee: z.number().min(0, 'Biaya admin minimal 0').optional(),
  selling_price: z.number().min(0, 'Harga jual minimal 0').optional(),
  is_active: z.boolean().optional(),
});

export const bulkDeletePpobProductSchema = z.object({
  uuids: z.array(z.string().min(1)).min(1, 'Pilih minimal 1 produk untuk dihapus'),
});

export const getPpobProductsByCategorySchema = z.object({
  category: z.string().min(1, 'Kategori wajib diisi'),
  brand: z.string().optional(),
});

export const getPpobBrandsByCategorySchema = z.object({
  category: z.string().min(1, 'Kategori wajib diisi'),
});
