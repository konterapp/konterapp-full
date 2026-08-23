import { z } from "zod";

const SaldoAccountTypes = z.enum(["cash", "bank", "e_wallet", "other"]);

export const createSaldoAccountSchema = z.object({
  code: z.string({ error: "Kode wajib diisi" }).min(1, "Kode wajib diisi").max(50, "Kode maksimal 50 karakter"),
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  type: SaldoAccountTypes,
  accountNumber: z.string().max(100, "No. rekening maksimal 100 karakter").optional().nullable().or(z.literal("")),
  accountName: z.string().max(100, "Nama akun maksimal 100 karakter").optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable().or(z.literal("")),
  isPaymentMethod: z.boolean().optional(),
  isActive: z.boolean().optional(),
  openingBalance: z.coerce.number().min(0, "Saldo awal tidak boleh negatif").optional(),
});

export const updateSaldoAccountSchema = createSaldoAccountSchema.omit({ openingBalance: true });

export const adjustSaldoSchema = z.object({
  direction: z.enum(["in", "out"], { error: "Arah mutasi wajib dipilih" }),
  amount: z.coerce.number({ error: "Jumlah wajib diisi" }).positive("Jumlah harus lebih dari 0"),
  notes: z.string().min(1, "Catatan wajib diisi, misal alasan koreksi").max(255, "Catatan maksimal 255 karakter"),
  branchUuid: z.string().optional().nullable().or(z.literal("")),
});
