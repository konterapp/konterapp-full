import { z } from "zod";

export const createBeritaSchema = z.object({
  title: z.string({ error: "Judul wajib diisi" }).min(1, "Judul wajib diisi").max(255, "Judul maksimal 255 karakter"),
  content: z.string({ error: "Konten wajib diisi" }).min(1, "Konten wajib diisi"),
  published_at: z.string({ error: "Tanggal publish wajib diisi" }).min(1, "Tanggal publish wajib diisi"),
  is_published: z.preprocess((v) => v === "1" || v === "true" || v === true, z.boolean()).optional().default(false),
  news_type: z.enum(["spotlight", "rilis-pers", "artikel"]).optional().nullable(),
  category: z.enum(["music", "sport-wellness", "culinary", "creative", "carnaval", "art-culture", "mice"]).optional().nullable(),
  tags: z.string().optional().nullable(), // JSON string, parsed in route
});

export const updateBeritaSchema = z.object({
  title: z.string({ error: "Judul wajib diisi" }).min(1, "Judul wajib diisi").max(255, "Judul maksimal 255 karakter"),
  content: z.string({ error: "Konten wajib diisi" }).min(1, "Konten wajib diisi"),
  published_at: z.string({ error: "Tanggal publish wajib diisi" }).min(1, "Tanggal publish wajib diisi"),
  is_published: z.preprocess((v) => v === "1" || v === "true" || v === true, z.boolean()).optional().default(false),
  news_type: z.enum(["spotlight", "rilis-pers", "artikel"]).optional().nullable(),
  category: z.enum(["music", "sport-wellness", "culinary", "creative", "carnaval", "art-culture", "mice"]).optional().nullable(),
  tags: z.string().optional().nullable(),
});
