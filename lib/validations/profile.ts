import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string({ error: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi")
    .max(255, "Nama maksimal 255 karakter")
    .optional(),
  current_password: z.string({ error: "Password saat ini wajib diisi" }).min(1, "Password saat ini wajib diisi").optional(),
  new_password: z.string().min(8, "Password baru minimal 8 karakter").optional(),
  new_password_confirmation: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
