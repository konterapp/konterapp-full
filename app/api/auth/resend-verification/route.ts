import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { emailVerificationService } from "@/lib/modules/auth/verification";

const resendSchema = z.object({
  email: z
    .string({ error: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Email tidak valid"),
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const result = validateSchema(resendSchema, body);
  if (!("data" in result)) return result;

  await emailVerificationService.resendByEmail(result.data.email);
  return successResponse(
    "Kalau email terdaftar dan belum terverifikasi, email verifikasi telah dikirim"
  );
});
