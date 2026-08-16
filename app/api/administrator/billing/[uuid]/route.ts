import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingAdminService } from "@/lib/modules/billing/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const result = await billingAdminService.getInvoiceDetail(uuid);
    return successResponse("Detail transaksi billing", result);
  })
);
