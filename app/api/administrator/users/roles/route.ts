import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { userService } from "@/lib/modules/users/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (req) => {
    const companyUuid = req.nextUrl.searchParams.get("company_uuid") ?? undefined;
    const roles = await userService.getRoles(companyUuid);

    return successResponse("Roles retrieved successfully", roles);
  })
);
