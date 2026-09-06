import { NextRequest } from "next/server";
import { successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { sendWhatsappTestSchema } from "@/lib/validations/whatsapp";
import { whatsappAdminService } from "@/lib/modules/whatsapp/admin.service";

export const POST = withPermission(
  "whatsapp.update",
  withApiErrorHandling(async (req: NextRequest, context) => {
    const rawBody = await req.json();
    const body = {
      phone: rawBody.phone ?? rawBody.phone_number,
      text: rawBody.text,
    };

    const result = validateSchema(sendWhatsappTestSchema, body);
    if (!("data" in result)) return result;

    const message = await whatsappAdminService.sendTestMessage(context.companyUuid, result.data);
    return successResponse("Notifikasi tes berhasil dikirim", message);
  })
);