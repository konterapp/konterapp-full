import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { listCompaniesForSelect } from "@/lib/modules/administrator/company.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async () => {
    const companies = await listCompaniesForSelect();
    return successResponse("Companies retrieved successfully", companies);
  })
);
