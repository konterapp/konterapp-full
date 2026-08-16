import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingWebhookService } from "@/lib/modules/billing/webhook.service";

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const expectedToken = process.env.MAYAR_WEBHOOK_TOKEN?.trim();
  if (expectedToken) {
    const providedToken = req.nextUrl.searchParams.get("token")?.trim();
    if (!providedToken || providedToken !== expectedToken) {
      return errorResponse("Unauthorized", 401);
    }
  }

  const body = await req.json();
  const eventType: string | undefined = body?.event;
  const invoiceId: string | undefined = body?.data?.id;

  if (eventType !== "payment.received" || !invoiceId) {
    return successResponse("Event diabaikan", { processed: false });
  }

  const result = await billingWebhookService.handleMayarInvoicePaid(invoiceId);
  return successResponse("Webhook diproses", result);
});
