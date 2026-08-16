import { z } from "zod";

export const createCompanySchema = z.object({
  code: z.string({ error: "Kode perusahaan wajib diisi" }).min(1, "Kode perusahaan wajib diisi").max(50, "Kode perusahaan maksimal 50 karakter"),
  name: z.string({ error: "Nama perusahaan wajib diisi" }).min(1, "Nama perusahaan wajib diisi").max(255, "Nama perusahaan maksimal 255 karakter"),
  is_active: z.boolean().optional(),
});

export const updateCompanySchema = createCompanySchema;
