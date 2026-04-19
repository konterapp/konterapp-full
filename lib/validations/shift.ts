import { z } from 'zod';

export const openShiftSchema = z.object({
  branch_uuid: z.string({ error: 'Cabang wajib dipilih' }).min(1, 'Cabang wajib dipilih').max(36, 'Cabang tidak valid'),
  opening_cash: z
    .number({ error: 'Kas awal wajib diisi' })
    .min(0, 'Kas awal tidak boleh negatif'),
  notes_open: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
});

export const closeShiftSchema = z.object({
  closing_cash: z
    .number({ error: 'Kas akhir wajib diisi' })
    .min(0, 'Kas akhir tidak boleh negatif'),
  notes_close: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
});
