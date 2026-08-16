import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { passwordResetService } from "@/lib/modules/auth/password-reset";

const resetPasswordSchema = z
  .object({
    token: z.string({ error: "Token wajib diisi" }).min(1, "Token wajib diisi"),
    password: z
      .string({ error: "Password wajib diisi" })
      .min(6, "Password minimal 6 karakter")
      .max(255, "Password maksimal 255 karakter"),
    password_confirmation: z.string({ error: "Konfirmasi password wajib diisi" }).min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["password_confirmation"],
  });

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const result = validateSchema(resetPasswordSchema, body);
  if (!("data" in result)) return result;

  const { token, password } = result.data;
  await passwordResetService.resetPassword(token, password);

  return successResponse("Password berhasil diatur ulang, silakan login");
});
