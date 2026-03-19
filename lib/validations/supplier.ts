import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string({ error: "Nama wajib diisi" }).min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  contact_person: z.string().max(255, "Nama kontak maksimal 255 karakter").optional().nullable().or(z.literal("")),
  phone: z.string({ error: "No. telepon wajib diisi" }).min(1, "No. telepon wajib diisi").max(20, "No. telepon maksimal 20 karakter"),
  email: z.union([
    z.literal(""),
    z.string().includes("@", { message: "Email tidak valid" }).max(255, "Email maksimal 255 karakter"),
  ]).optional().nullable(),
  address: z.string().optional().nullable().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter").optional(),
  contact_person: z.string().max(255, "Nama kontak maksimal 255 karakter").optional().nullable().or(z.literal("")),
  phone: z.string().min(1, "No. telepon wajib diisi").max(20, "No. telepon maksimal 20 karakter").optional(),
  email: z.union([
    z.literal(""),
    z.string().includes("@", { message: "Email tidak valid" }).max(255, "Email maksimal 255 karakter"),
  ]).optional().nullable(),
  address: z.string().optional().nullable().or(z.literal("")),
  is_active: z.boolean().optional(),
});
