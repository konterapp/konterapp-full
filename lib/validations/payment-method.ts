import { z } from "zod";

const PaymentMethodTypes = z.enum([
  "cash",
  "bank_transfer",
  "qris",
  "e_wallet",
  "credit_card",
  "debit_card",
  "other",
]);

export const createPaymentMethodSchema = z.object({
  code: z.string({ error: "Kode wajib diisi" }).min(1, "Kode wajib diisi").max(50, "Kode maksimal 50 karakter"),
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  type: PaymentMethodTypes,
  accountNumber: z.string().max(100, "No. rekening maksimal 100 karakter").optional().nullable().or(z.literal("")),
  accountName: z.string().max(100, "Nama akun maksimal 100 karakter").optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema;
