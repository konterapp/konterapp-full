import { z } from "zod";

export const loginSchema = z.object({
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }),
  password: z.string({ error: "Password wajib diisi" }).min(1, "Password wajib diisi"),
});

export const createCompanySchema = z.object({
  company_name: z
    .string({ error: "Nama perusahaan wajib diisi" })
    .trim()
    .min(2, "Nama perusahaan minimal 2 karakter")
    .max(255, "Nama perusahaan maksimal 255 karakter"),
});

export const registerSchema = z
  .object({
    name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
    email: z
      .string({ error: "Email wajib diisi" })
      .min(1, "Email wajib diisi")
      .email("Email tidak valid")
      .max(255, "Email maksimal 255 karakter"),
    password: z
      .string({ error: "Password wajib diisi" })
      .min(6, "Password minimal 6 karakter")
      .max(255, "Password maksimal 255 karakter"),
    password_confirmation: z.string({ error: "Konfirmasi password wajib diisi" }).min(1, "Konfirmasi password wajib diisi"),
    company_name: z.string().trim().max(255, "Nama perusahaan maksimal 255 karakter").optional(),
    referral_code: z
      .string()
      .trim()
      .toUpperCase()
      .max(20, "Kode referral maksimal 20 karakter")
      .optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["password_confirmation"],
  });
