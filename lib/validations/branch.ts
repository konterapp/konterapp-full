import { z } from "zod";

export const createBranchSchema = z.object({
  code: z.string({ error: "Kode cabang wajib diisi" }).min(1, "Kode cabang wajib diisi").max(20, "Kode cabang maksimal 20 karakter"),
  name: z.string({ error: "Nama cabang wajib diisi" }).min(1, "Nama cabang wajib diisi").max(255, "Nama cabang maksimal 255 karakter"),
  address: z.string().optional().nullable().or(z.literal("")),
  phone: z.string().max(20, "No. telepon maksimal 20 karakter").optional().nullable().or(z.literal("")),
  email: z.union([
    z.literal(""),
    z.string().includes("@", { message: "Email tidak valid" }).max(255, "Email maksimal 255 karakter"),
  ]).optional().nullable(),
  isActive: z.boolean().optional(),
  isMain: z.boolean().optional(),
});

export const updateBranchSchema = createBranchSchema;
