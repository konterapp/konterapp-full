import { z } from 'zod';

const stockOpnameItemSchema = z.object({
  product_uuid: z.string({ error: 'Produk wajib dipilih' }).min(1, 'Produk wajib dipilih').max(36, 'Produk tidak valid'),
  actual_stock: z
    .number({ error: 'Stok aktual wajib diisi' })
    .int('Stok aktual harus bilangan bulat')
    .min(0, 'Stok aktual tidak boleh negatif'),
});

export const createStockOpnameSchema = z.object({
  branch_uuid: z.string({ error: 'Cabang wajib dipilih' }).min(1, 'Cabang wajib dipilih').max(36, 'Cabang tidak valid'),
  items: z.array(stockOpnameItemSchema).min(1, 'Minimal 1 produk untuk opname').max(500, 'Maksimal 500 item per opname'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
});
