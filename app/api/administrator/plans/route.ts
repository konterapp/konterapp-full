import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingRepository } from "@/lib/modules/billing/repository";
import { formatPlansCatalog } from "@/lib/modules/billing/billing.mapper";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async () => {
    const plans = await billingRepository.listPlansWithTiers();
    return successResponse("Daftar paket berhasil dimuat", formatPlansCatalog(plans));
  })
);
