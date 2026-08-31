import { z } from "zod";

const CashDirectionEnum = z.enum(["in", "out"]);

export const createPpobTransactionTypeSchema = z.object({
  name: z.string({ error: "Nama jenis transaksi wajib diisi" }).min(1, "Nama jenis transaksi wajib diisi").max(100, "Maksimal 100 karakter"),
  cashDirection: CashDirectionEnum,
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int("Urutan wajib bilangan bulat").optional(),
});

export const updatePpobTransactionTypeSchema = createPpobTransactionTypeSchema.partial();

export const createPpobTransactionSchema = z.object({
  branchUuid: z.string({ error: "Cabang wajib dipilih" }).min(1, "Cabang wajib dipilih"),
  saldoAccountUuid: z.string({ error: "Akun server wajib dipilih" }).min(1, "Akun server wajib dipilih"),
  transactionTypeUuid: z.string({ error: "Jenis transaksi wajib dipilih" }).min(1, "Jenis transaksi wajib dipilih"),
  accountReference: z.string().max(100, "Maksimal 100 karakter").optional().nullable().or(z.literal("")),
  baseAmount: z.coerce.number({ error: "Modal wajib diisi" }).positive("Modal harus lebih dari 0"),
  sellingAmount: z.coerce.number({ error: "Harga jual wajib diisi" }).min(0, "Tidak boleh negatif"),
  adminFee: z.coerce.number().min(0, "Tidak boleh negatif").optional(),
  paymentMethodUuid: z.string({ error: "Metode pembayaran wajib dipilih" }).min(1, "Metode pembayaran wajib dipilih"),
  paidAmount: z.coerce.number().min(0, "Tidak boleh negatif").optional(),
  notes: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable().or(z.literal("")),
});
