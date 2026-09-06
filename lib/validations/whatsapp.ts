import { z } from "zod";

const PHONE_RE = /^[0-9+\s()-]{9,16}$/;

export const updateWhatsappSettingsSchema = z
  .object({
    targetPhone: z
      .string()
      .max(20, "Nomor maksimal 20 karakter")
      .regex(PHONE_RE, "Nomor WhatsApp tidak valid")
      .nullable()
      .optional()
      .or(z.literal("")),
    stockLowEnabled: z.boolean().optional(),
    stockLowThreshold: z.coerce.number().int("Batas stok wajib bilangan bulat").min(0, "Batas stok tidak boleh negatif").nullable().optional(),
    saldoLowEnabled: z.boolean().optional(),
    saldoLowThreshold: z.coerce.number().min(0, "Batas saldo tidak boleh negatif").nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.stockLowEnabled && (val.stockLowThreshold === null || val.stockLowThreshold === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stockLowThreshold"],
        message: "Batas stok wajib diisi saat notifikasi stok menipis aktif",
      });
    }
    if (val.saldoLowEnabled && (val.saldoLowThreshold === null || val.saldoLowThreshold === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["saldoLowThreshold"],
        message: "Batas saldo wajib diisi saat notifikasi saldo menipis aktif",
      });
    }
  });

export const sendWhatsappTestSchema = z.object({
  phone: z.string().max(20, "Nomor maksimal 20 karakter").nullable().optional().or(z.literal("")),
  text: z.string().max(2000, "Teks maksimal 2000 karakter").optional(),
});