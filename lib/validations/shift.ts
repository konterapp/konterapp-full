import { z } from 'zod';

export const openShiftSchema = z.object({
  branch_uuid: z.string({ error: 'Cabang wajib dipilih' }).min(1, 'Cabang wajib dipilih').max(36, 'Cabang tidak valid'),
  notes_open: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
});

export const closeShiftSchema = z.object({
  notes_close: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
});
