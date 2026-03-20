import { successResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { roleService } from "@/lib/modules/roles/admin.service";

export const GET = withAuth(
  withApiErrorHandling(async () => {
    const permissions = await roleService.listPermissions();

    return successResponse("Permissions retrieved successfully", permissions);
  })
);
