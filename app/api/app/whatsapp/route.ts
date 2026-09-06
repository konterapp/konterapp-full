import { NextRequest } from "next/server";
import { successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { updateWhatsappSettingsSchema } from "@/lib/validations/whatsapp";
import { whatsappAdminService } from "@/lib/modules/whatsapp/admin.service";

export const GET = withPermission(
  "whatsapp.index",
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const status = await whatsappAdminService.getStatus(context.companyUuid);
    return successResponse("Status WhatsApp berhasil dimuat", status);
  })
);

export const PUT = withPermission(
  "whatsapp.update",
  withApiErrorHandling(async (req: NextRequest, context) => {
    const rawBody = await req.json();
    const body = {
      targetPhone: rawBody.targetPhone ?? rawBody.target_phone,
      stockLowEnabled: rawBody.stockLowEnabled ?? rawBody.stock_low_enabled,
      stockLowThreshold: rawBody.stockLowThreshold ?? rawBody.stock_low_threshold ?? null,
      saldoLowEnabled: rawBody.saldoLowEnabled ?? rawBody.saldo_low_enabled,
      saldoLowThreshold: rawBody.saldoLowThreshold ?? rawBody.saldo_low_threshold ?? null,
    };

    const result = validateSchema(updateWhatsappSettingsSchema, body);
    if (!("data" in result)) return result;

    const settings = await whatsappAdminService.updateSettings(context.companyUuid, result.data);
    return successResponse("Pengaturan notifikasi WhatsApp berhasil disimpan", settings);
  })
);