import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { companyInvitationService } from "@/lib/modules/auth/company-invitation";

const acceptInvitationSchema = z.object({
  token: z.string({ error: "Token wajib diisi" }).min(1, "Token wajib diisi"),
});

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const result = validateSchema(acceptInvitationSchema, body);
  if (!("data" in result)) return result;

  const data = await companyInvitationService.acceptToken(result.data.token);
  return successResponse(
    `Undangan bergabung ke ${data.company_name} berhasil diterima, silakan login`,
    data
  );
});
