import { successResponse } from "@/lib/response";
import { withPermissionNoSubscriptionGate } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingTenantService } from "@/lib/modules/billing/tenant.service";

export const GET = withPermissionNoSubscriptionGate(
  "billing.index",
  withApiErrorHandling(async (_req, context) => {
    const result = await billingTenantService.getBillingStatus(
      context.companyUuid,
      context.userId
    );
    return successResponse("Billing status retrieved successfully", result);
  })
);
