import { z } from "zod";
import { PERMISSIONS } from "@/lib/modules/roles/permissions";

export const createRoleSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
  is_full_access: z.boolean().default(false),
});

export const updateRoleSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter").optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  is_full_access: z.boolean().optional(),
});
