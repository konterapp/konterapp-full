import { z } from 'zod';

const stockTransferItemSchema = z.object({
  product_uuid: z.string({ error: 'Produk wajib dipilih' }).min(1, 'Produk wajib dipilih').max(36, 'Produk tidak valid'),
  quantity: z.coerce.number().int('Qty harus bilangan bulat').min(1, 'Qty minimal 1'),
});

export const createStockTransferSchema = z
  .object({
    from_branch_uuid: z.string({ error: 'Cabang asal wajib dipilih' }).min(1, 'Cabang asal wajib dipilih').max(36, 'Cabang asal tidak valid'),
    to_branch_uuid: z.string({ error: 'Cabang tujuan wajib dipilih' }).min(1, 'Cabang tujuan wajib dipilih').max(36, 'Cabang tujuan tidak valid'),
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
    items: z.array(stockTransferItemSchema).min(1, 'Minimal 1 produk untuk transfer').max(500, 'Maksimal 500 item transfer'),
  })
  .superRefine((data, ctx) => {
    if (data.from_branch_uuid && data.to_branch_uuid && data.from_branch_uuid === data.to_branch_uuid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cabang asal dan tujuan tidak boleh sama',
        path: ['to_branch_uuid'],
      });
    }
  });
