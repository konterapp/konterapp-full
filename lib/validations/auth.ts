import { z } from "zod";

export const loginSchema = z.object({
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }),
  password: z.string({ error: "Password wajib diisi" }).min(1, "Password wajib diisi"),
});

export const registerSchema = z.object({
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
});
