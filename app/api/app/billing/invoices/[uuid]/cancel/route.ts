import { successResponse } from "@/lib/response";
import { withPermissionNoSubscriptionGate } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingTenantService } from "@/lib/modules/billing/tenant.service";

export const POST = withPermissionNoSubscriptionGate(
  "billing.index",
  withApiErrorHandling(async (req, context) => {
    const params = await context.params;
    const invoiceUuid = params.uuid as string;
    const invoice = await billingTenantService.cancelInvoice(context.companyUuid, invoiceUuid);
    return successResponse("Invoice berhasil dibatalkan", invoice);
  })
);
