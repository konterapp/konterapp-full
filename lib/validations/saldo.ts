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
  showInShift: z.boolean().optional(),
  sortOrder: z.coerce.number().int("Urutan wajib bilangan bulat").optional(),
  // Independen dari `type` -- akun apa pun (mis. DANA, BRI) bisa ditandai
  // boleh dipakai buat transaksi Agen Bank.
  isBankAgent: z.boolean().optional(),
  // Sama polanya dgn isBankAgent -- akun apa pun bisa ditandai boleh
  // dipakai sbg "server"/deposit PPOB (Server Pulsa).
  isPpobServer: z.boolean().optional(),
  openingBalance: z.coerce.number().min(0, "Saldo awal tidak boleh negatif").optional(),
});

// Edit metadata akun induk TIDAK termasuk accountNumber/accountName --
// nomor rekening/nama pemilik akun sekarang milik grup balance (1 akun
// induk bisa punya beberapa grup dengan rekening fisik berbeda-beda).
export const updateSaldoAccountSchema = createSaldoAccountSchema.omit({
  openingBalance: true,
  accountNumber: true,
  accountName: true,
});

export const addSaldoBalanceGroupSchema = z.object({
  name: z.string().max(100, "Nama grup maksimal 100 karakter").optional().nullable().or(z.literal("")),
  accountNumber: z.string().max(100, "No. rekening maksimal 100 karakter").optional().nullable().or(z.literal("")),
  accountName: z.string().max(100, "Nama akun maksimal 100 karakter").optional().nullable().or(z.literal("")),
  branchUuids: z
    .array(z.string({ error: "Cabang wajib dipilih" }).min(1, "Cabang tidak valid"))
    .min(1, "Pilih minimal 1 cabang untuk grup balance baru"),
  openingBalance: z.coerce.number().min(0, "Saldo awal tidak boleh negatif").optional(),
  notes: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable().or(z.literal("")),
});

export const updateSaldoBalanceGroupSchema = z.object({
  name: z.string().max(100, "Nama grup maksimal 100 karakter").optional().nullable().or(z.literal("")),
  accountNumber: z.string().max(100, "No. rekening maksimal 100 karakter").optional().nullable().or(z.literal("")),
  accountName: z.string().max(100, "Nama akun maksimal 100 karakter").optional().nullable().or(z.literal("")),
  branchUuids: z.array(z.string({ error: "Cabang tidak valid" }).min(1, "Cabang tidak valid")).optional().default([]),
});

export const moveSaldoAccountSchema = z.object({
  direction: z.enum(["up", "down"], { error: "Arah urutan wajib dipilih" }),
});

export const adjustSaldoSchema = z.object({
  direction: z.enum(["in", "out"], { error: "Arah mutasi wajib dipilih" }),
  amount: z.coerce.number({ error: "Jumlah wajib diisi" }).positive("Jumlah harus lebih dari 0"),
  notes: z.string().min(1, "Catatan wajib diisi, misal alasan koreksi").max(255, "Catatan maksimal 255 karakter"),
  branchUuid: z.string().optional().nullable().or(z.literal("")),
});
