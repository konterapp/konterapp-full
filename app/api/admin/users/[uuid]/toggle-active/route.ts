import { errorResponse, successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { userService } from "@/lib/modules/users/admin.service";

export const PATCH = withPermission("admin.user.update", async (_req, context) => {
  try {
    const params = await context.params;
    const result = await userService.toggleUserActive(params.uuid);

    if (!result.ok) {
      return errorResponse(result.message ?? "Internal server error", result.statusCode);
    }

    return successResponse(result.message ?? "User updated successfully", result.data);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
