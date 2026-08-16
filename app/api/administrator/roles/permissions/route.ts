import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { roleService } from "@/lib/modules/roles/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async () => {
    const permissions = await roleService.listPermissions();

    return successResponse("Permissions retrieved successfully", permissions);
  })
);
