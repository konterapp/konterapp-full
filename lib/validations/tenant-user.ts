import { z } from "zod";

export const createAppUserSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }),
  password: z.string({ error: "Password wajib diisi" }).min(8, "Password minimal 8 karakter"),
  role_uuids: z.array(z.string({ error: "Role wajib dipilih" }).min(1)).min(1, "Role wajib dipilih"),
});

export const updateAppUserSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter").optional(),
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }).optional(),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  role_uuids: z.array(z.string({ error: "Role wajib dipilih" }).min(1)).optional(),
  is_active: z.boolean().optional(),
});
