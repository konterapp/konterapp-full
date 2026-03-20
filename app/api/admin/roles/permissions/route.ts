import { successResponse, errorResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { roleService } from "@/lib/modules/roles/admin.service";

export const GET = withAuth(async () => {
  try {
    const permissions = await roleService.listPermissions();

    return successResponse("Permissions retrieved successfully", permissions);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
