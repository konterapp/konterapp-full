import { successResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingTenantService } from "@/lib/modules/billing/tenant.service";

export const POST = withAuth(
  withApiErrorHandling(async (_req, context) => {
    const invoice = await billingTenantService.createCheckoutInvoice(context.companyUuid, context.userId);
    return successResponse("Invoice checkout berhasil dibuat", invoice, 201);
  })
);
