import { successResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingTenantService } from "@/lib/modules/billing/tenant.service";

export const POST = withAuth(
  withApiErrorHandling(async (req, context) => {
    const origin = req.headers.get("origin");
    const redirectUrl = origin ? `${origin}/app/billing` : undefined;
    const invoice = await billingTenantService.createCheckoutInvoice(
      context.companyUuid,
      context.userId,
      redirectUrl
    );
    return successResponse("Invoice checkout berhasil dibuat", invoice, 201);
  })
);
