import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }),
  password: z.string({ error: "Password wajib diisi" }).min(8, "Password minimal 8 karakter"),
  company_uuid: z.string({ error: "Perusahaan (tenant) wajib dipilih" }).min(1, "Perusahaan (tenant) wajib dipilih"),
  roles: z.coerce.number({ error: "Role wajib dipilih" }).min(1, "Role wajib dipilih"),
});

export const updateUserSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  roles: z.coerce.number({ error: "Role wajib dipilih" }).min(1, "Role wajib dipilih"),
});
