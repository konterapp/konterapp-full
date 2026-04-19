import { z } from "zod";

export const createUnitSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(20, "Nama maksimal 20 karakter"),
  description: z.string().optional().nullable().or(z.literal("")),
});

export const updateUnitSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(20, "Nama maksimal 20 karakter").optional(),
  description: z.string().optional().nullable().or(z.literal("")),
});
