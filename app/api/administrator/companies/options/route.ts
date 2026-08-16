import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { companyService } from "@/lib/modules/company/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async () => {
    const companies = await companyService.listCompanyOptions();
    return successResponse("Companies retrieved successfully", companies);
  })
);
