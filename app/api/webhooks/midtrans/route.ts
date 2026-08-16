import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { midtransNotificationSchema } from "@/lib/validations/billing";
import { billingWebhookService } from "@/lib/modules/billing/webhook.service";

// Midtrans dashboard's URL check/reachability probe may hit this endpoint
// with GET before actually sending POST notifications.
export async function GET() {
  return successResponse("Midtrans webhook endpoint aktif");
}

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Body tidak valid, harus JSON", 400);
  }

  const validated = validateSchema(midtransNotificationSchema, body);
  if (!("data" in validated)) return validated;

  const result = await billingWebhookService.handleNotification(validated.data);
  return successResponse("Notifikasi diproses", result);
});
