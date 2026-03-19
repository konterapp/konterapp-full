import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  description: z.string().optional().nullable().or(z.literal("")),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter").optional(),
  description: z.string().optional().nullable().or(z.literal("")),
});
