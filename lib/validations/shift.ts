import { z } from 'zod';

// Map saldo_account_balance_uuid -> nominal hasil hitung/cek fisik kasir --
// opsional per akun (kasir boleh skip akun yang tidak dicek), dipakai buat
// hitung Selisih dibanding saldo sistem saat itu. Berlaku utk akun apa pun
// (tunai, e-wallet, bank), bukan cuma tipe cash.
const actualBalancesSchema = z.record(z.string(), z.coerce.number()).optional();

export const openShiftSchema = z.object({
  branch_uuid: z.string({ error: 'Cabang wajib dipilih' }).min(1, 'Cabang wajib dipilih').max(36, 'Cabang tidak valid'),
  notes_open: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
  actual_balances: actualBalancesSchema,
});

export const closeShiftSchema = z.object({
  notes_close: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable().or(z.literal('')),
  actual_balances: actualBalancesSchema,
});
