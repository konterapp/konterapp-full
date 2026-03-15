import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string({ error: "Nama role wajib diisi" }).min(1, "Nama role wajib diisi").max(255, "Nama role maksimal 255 karakter"),
  permissions: z.array(z.string()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string({ error: "Nama role wajib diisi" }).min(1, "Nama role wajib diisi").max(255, "Nama role maksimal 255 karakter"),
  permissions: z.array(z.string()).optional(),
});
