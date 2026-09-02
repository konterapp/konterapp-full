import { z } from "zod";

const CashDirectionEnum = z.enum(["in", "out"]);
const FeeReceivedViaEnum = z.enum(["deducted", "cash", "balance"]);

export const createBankAgentTransactionTypeSchema = z.object({
  name: z.string({ error: "Nama jenis transaksi wajib diisi" }).min(1, "Nama jenis transaksi wajib diisi").max(100, "Maksimal 100 karakter"),
  cashDirection: CashDirectionEnum,
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int("Urutan wajib bilangan bulat").optional(),
});

export const updateBankAgentTransactionTypeSchema = createBankAgentTransactionTypeSchema.partial();

// Validasi "feeReceivedVia wajib kalau ada komisi & jenisnya arah kas keluar"
// TIDAK bisa dicek di sini (schema ini tidak tahu cashDirection jenisnya,
// itu butuh lookup DB) -- dicek di admin.service.ts::createTransaction
// setelah jenis transaksinya di-resolve.
export const createBankAgentTransactionSchema = z.object({
  branchUuid: z.string({ error: "Cabang wajib dipilih" }).min(1, "Cabang wajib dipilih"),
  saldoAccountUuid: z.string({ error: "Akun wajib dipilih" }).min(1, "Akun wajib dipilih"),
  transactionTypeUuid: z.string({ error: "Jenis transaksi wajib dipilih" }).min(1, "Jenis transaksi wajib dipilih"),
  accountReference: z.string().max(100, "Maksimal 100 karakter").optional().nullable().or(z.literal("")),
  baseAmount: z.coerce.number({ error: "Nominal wajib diisi" }).positive("Nominal harus lebih dari 0"),
  sellingAmount: z.coerce.number({ error: "Nominal yang dibayar/diterima pelanggan wajib diisi" }).min(0, "Tidak boleh negatif"),
  fee: z.coerce.number().min(0, "Tidak boleh negatif").optional(),
  adminFee: z.coerce.number().min(0, "Tidak boleh negatif").optional(),
  feeReceivedVia: FeeReceivedViaEnum.optional().nullable(),
  paymentMethodUuid: z.string({ error: "Metode pembayaran wajib dipilih" }).min(1, "Metode pembayaran wajib dipilih"),
  paidAmount: z.coerce.number().min(0, "Tidak boleh negatif").optional(),
  notes: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable().or(z.literal("")),
});
