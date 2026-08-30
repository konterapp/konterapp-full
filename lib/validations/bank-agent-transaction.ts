import { z } from "zod";

const TransactionTypeEnum = z.enum(["deposit", "withdrawal", "transfer"]);
const FeeReceivedViaEnum = z.enum(["deducted", "cash", "balance"]);

export const createBankAgentTransactionSchema = z
  .object({
    branchUuid: z.string({ error: "Cabang wajib dipilih" }).min(1, "Cabang wajib dipilih"),
    saldoAccountUuid: z.string({ error: "Akun wajib dipilih" }).min(1, "Akun wajib dipilih"),
    transactionType: TransactionTypeEnum,
    accountReference: z.string().max(100, "Maksimal 100 karakter").optional().nullable().or(z.literal("")),
    baseAmount: z.coerce.number({ error: "Nominal wajib diisi" }).positive("Nominal harus lebih dari 0"),
    sellingAmount: z.coerce.number({ error: "Nominal yang dibayar/diterima pelanggan wajib diisi" }).min(0, "Tidak boleh negatif"),
    fee: z.coerce.number().min(0, "Tidak boleh negatif").optional(),
    adminFee: z.coerce.number().min(0, "Tidak boleh negatif").optional(),
    // Wajib diisi khusus Tarik Tunai kalau ada komisi -- menentukan formula
    // kas keluar (dipotong dari tunai / tunai terpisah / ikut rekening).
    feeReceivedVia: FeeReceivedViaEnum.optional().nullable(),
    paymentMethodUuid: z.string({ error: "Metode pembayaran wajib dipilih" }).min(1, "Metode pembayaran wajib dipilih"),
    paidAmount: z.coerce.number().min(0, "Tidak boleh negatif").optional(),
    notes: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable().or(z.literal("")),
  })
  .refine((data) => data.transactionType !== "withdrawal" || (data.fee ?? 0) <= 0 || !!data.feeReceivedVia, {
    message: "Wajib dipilih kalau Tarik Tunai ada komisi",
    path: ["feeReceivedVia"],
  });
