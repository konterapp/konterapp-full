import { successResponse } from "@/lib/response";
import { withPermissionNoSubscriptionGate } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingRepository } from "@/lib/modules/billing/repository";
import { formatPlansCatalog } from "@/lib/modules/billing/billing.mapper";

export const GET = withPermissionNoSubscriptionGate(
  "billing.index",
  withApiErrorHandling(async () => {
    const plans = await billingRepository.listPlansWithTiers();
    return successResponse("Daftar paket berhasil dimuat", formatPlansCatalog(plans));
  })
);
