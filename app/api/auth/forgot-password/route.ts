import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { passwordResetService } from "@/lib/modules/auth/password-reset";

const forgotPasswordSchema = z.object({
  email: z
    .string({ error: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Email tidak valid"),
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const result = validateSchema(forgotPasswordSchema, body);
  if (!("data" in result)) return result;

  await passwordResetService.requestReset(result.data.email);
  return successResponse(
    "Email untuk atur ulang password telah dikirim, silakan cek inbox Anda"
  );
});
