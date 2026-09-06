import { NextRequest } from "next/server";
import { successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { whatsappAdminService } from "@/lib/modules/whatsapp/admin.service";

export const POST = withPermission(
  "whatsapp.update",
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const state = await whatsappAdminService.connect(context.companyUuid);
    return successResponse("Koneksi WhatsApp diproses. Scan QR bila muncul.", state);
  })
);