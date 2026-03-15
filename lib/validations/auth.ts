import { z } from "zod";

export const loginSchema = z.object({
  email: z.string({ error: "Email wajib diisi" }).min(1, "Email wajib diisi").includes("@", { message: "Email tidak valid" }),
  password: z.string({ error: "Password wajib diisi" }).min(1, "Password wajib diisi"),
});
