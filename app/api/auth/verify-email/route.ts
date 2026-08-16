import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { emailVerificationService } from "@/lib/modules/auth/verification";

const verifyEmailSchema = z.object({
  token: z.string({ error: "Token wajib diisi" }).min(1, "Token wajib diisi"),
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const result = validateSchema(verifyEmailSchema, body);
  if (!("data" in result)) return result;

  await emailVerificationService.verifyToken(result.data.token);
  return successResponse("Email berhasil diverifikasi, silakan login");
});
