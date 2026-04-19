import { z } from 'zod';

const purchaseItemSchema = z
  .object({
    product_uuid: z.string({ error: 'Produk wajib dipilih' }).min(1, 'Produk wajib dipilih').max(36, 'Produk tidak valid'),
    quantity: z.coerce.number().int('Qty harus bilangan bulat').min(1, 'Qty minimal 1'),
    unit_price: z.coerce.number().min(0, 'Harga beli tidak boleh negatif'),
    discount: z.coerce.number().min(0, 'Diskon item tidak boleh negatif').optional().default(0),
  })
  .superRefine((item, ctx) => {
    const maxDiscount = Number(item.quantity) * Number(item.unit_price);
    if (Number(item.discount || 0) > maxDiscount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Diskon item tidak boleh melebihi subtotal item',
        path: ['discount'],
      });
    }
  });

export const createPurchaseSchema = z.object({
  branch_uuid: z.string({ error: 'Cabang wajib dipilih' }).min(1, 'Cabang wajib dipilih').max(36, 'Cabang tidak valid'),
  supplier_uuid: z.string({ error: 'Supplier wajib dipilih' }).min(1, 'Supplier wajib dipilih').max(36, 'Supplier tidak valid'),
  purchase_date: z.string().optional().nullable().or(z.literal('')),
  discount_amount: z.coerce.number().min(0, 'Diskon tidak boleh negatif').optional().default(0),
  paid_amount: z.coerce.number().min(0, 'Nominal bayar tidak boleh negatif').optional().default(0),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
  items: z.array(purchaseItemSchema).min(1, 'Minimal 1 item pembelian').max(500, 'Maksimal 500 item pembelian'),
});
