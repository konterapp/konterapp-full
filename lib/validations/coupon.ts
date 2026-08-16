import { z } from "zod";

export const couponCodeSchema = z.object({
  code: z
    .string({ error: "Kode kupon wajib diisi" })
    .trim()
    .toUpperCase()
    .min(1, "Kode kupon wajib diisi")
    .max(50, "Kode kupon maksimal 50 karakter"),
});

const baseCouponSchema = couponCodeSchema.extend({
  name: z
    .string({ error: "Nama kupon wajib diisi" })
    .trim()
    .min(1, "Nama kupon wajib diisi")
    .max(255, "Nama kupon maksimal 255 karakter"),
  description: z
    .string()
    .trim()
    .max(255, "Deskripsi maksimal 255 karakter")
    .optional()
    .nullable(),
  plan_code: z
    .string()
    .trim()
    .max(50, "Paket maksimal 50 karakter")
    .optional()
    .nullable(),
  discount_percent: z.coerce
    .number({ error: "Persentase diskon wajib diisi" })
    .min(0.01, "Persentase diskon minimal 0.01")
    .max(100, "Persentase diskon maksimal 100"),
  max_discount: z.coerce
    .number()
    .min(0, "Cap diskon tidak boleh negatif")
    .optional()
    .nullable(),
  usage_limit: z.coerce
    .number()
    .int("Kuota harus bilangan bulat")
    .min(1, "Kuota minimal 1")
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
});

function validatePeriod(value: {
  starts_at?: string | null;
  expires_at?: string | null;
}, ctx: z.RefinementCtx) {
  if (value.starts_at && Number.isNaN(Date.parse(value.starts_at))) {
    ctx.addIssue({ code: "custom", path: ["starts_at"], message: "Format tanggal mulai tidak valid" });
  }
  if (value.expires_at && Number.isNaN(Date.parse(value.expires_at))) {
    ctx.addIssue({ code: "custom", path: ["expires_at"], message: "Format tanggal berakhir tidak valid" });
  }
  if (value.starts_at && value.expires_at && Date.parse(value.expires_at) < Date.parse(value.starts_at)) {
    ctx.addIssue({ code: "custom", path: ["expires_at"], message: "Tanggal berakhir sebelum tanggal mulai" });
  }
}

export const createCouponSchema = baseCouponSchema.superRefine(validatePeriod);
export const updateCouponSchema = baseCouponSchema.partial().superRefine(validatePeriod);
