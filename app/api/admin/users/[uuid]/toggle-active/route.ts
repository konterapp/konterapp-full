import { successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { userService } from "@/lib/modules/users/admin.service";

export const PATCH = withPermission(
  "admin.user.update",
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const result = await userService.toggleUserActive(uuid);
    const message = result.is_active ? "User activated successfully" : "User deactivated successfully";

    return successResponse(message, result);
  })
);
