import { z } from "zod";

export const createCompanySchema = z.object({
  code: z.string({ error: "Kode perusahaan wajib diisi" }).min(1, "Kode perusahaan wajib diisi").max(50, "Kode perusahaan maksimal 50 karakter"),
  name: z.string({ error: "Nama perusahaan wajib diisi" }).min(1, "Nama perusahaan wajib diisi").max(255, "Nama perusahaan maksimal 255 karakter"),
  is_active: z.boolean().optional(),
});

// Kode perusahaan tidak dapat diubah setelah dibuat (dipakai sebagai
// referensi lintas modul), jadi schema update sengaja tidak menerima `code`.
export const updateCompanySchema = createCompanySchema.omit({ code: true });

// Ubah profil perusahaan dari sisi tenant (/app): hanya nama yang boleh
// diubah. Kode & status aktif dikelola administrator SaaS.
export const updateTenantCompanySchema = z.object({
  name: z
    .string({ error: "Nama perusahaan wajib diisi" })
    .trim()
    .min(2, "Nama perusahaan minimal 2 karakter")
    .max(255, "Nama perusahaan maksimal 255 karakter"),
});
