import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? null : value), schema);

export const createUserSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }),
  password: z.string({ error: "Password wajib diisi" }).min(8, "Password minimal 8 karakter"),
  company_uuid: z.string({ error: "Perusahaan (tenant) wajib dipilih" }).min(1, "Perusahaan (tenant) wajib dipilih"),
  phone_without_dc: z.string({ error: "Nomor telepon wajib diisi" }).min(1, "Nomor telepon wajib diisi"),
  dc: z.string({ error: "Kode negara wajib dipilih" }).min(1, "Kode negara wajib dipilih"),
  iso: z.string({ error: "Kode ISO wajib dipilih" }).min(1, "Kode ISO wajib dipilih"),
  roles: z.coerce.number({ error: "Role wajib dipilih" }).min(1, "Role wajib dipilih"),
  title: emptyToNull(z.string().max(255).optional().nullable()),
  company: emptyToNull(z.string().max(255).optional().nullable()),
  work_unit: emptyToNull(z.string().max(255).optional().nullable()),
  admin_scope: emptyToNull(z.enum(["daerah", "nasional", "internasional", "mice"]).optional().nullable()),
  province_id: emptyToNull(z.coerce.number().optional().nullable()),
  city_id: emptyToNull(z.coerce.number().optional().nullable()),
  wilayah_kode: emptyToNull(z.string().optional().nullable()),
});

export const updateUserSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  phone_without_dc: z.string({ error: "Nomor telepon wajib diisi" }).min(1, "Nomor telepon wajib diisi"),
  dc: z.string({ error: "Kode negara wajib dipilih" }).min(1, "Kode negara wajib dipilih"),
  iso: z.string({ error: "Kode ISO wajib dipilih" }).min(1, "Kode ISO wajib dipilih"),
  roles: z.coerce.number({ error: "Role wajib dipilih" }).min(1, "Role wajib dipilih"),
  title: emptyToNull(z.string().max(255).optional().nullable()),
  company: emptyToNull(z.string().max(255).optional().nullable()),
  work_unit: emptyToNull(z.string().max(255).optional().nullable()),
  admin_scope: emptyToNull(z.enum(["daerah", "nasional", "internasional", "mice"]).optional().nullable()),
  province_id: emptyToNull(z.coerce.number().optional().nullable()),
  city_id: emptyToNull(z.coerce.number().optional().nullable()),
  wilayah_kode: emptyToNull(z.string().optional().nullable()),
});
