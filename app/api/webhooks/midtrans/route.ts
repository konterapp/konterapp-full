import { NextRequest } from "next/server";
import { successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingWebhookService } from "@/lib/modules/billing/webhook.service";

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const result = await billingWebhookService.handleNotification(body);
  return successResponse("Notifikasi diproses", result);
});
