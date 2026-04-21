import { z } from 'zod';

export const payPayableSchema = z.object({
  amount: z.coerce.number().positive('Nominal bayar harus lebih dari 0'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
});
