import { NextRequest } from "next/server";
import { successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { whatsappAdminService } from "@/lib/modules/whatsapp/admin.service";

export const GET = withPermission(
  "whatsapp.index",
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("per_page") || "20", 10);

    const result = await whatsappAdminService.listMessages(context.companyUuid, page, perPage);
    return successResponse("Log pesan WhatsApp berhasil dimuat", result);
  })
);