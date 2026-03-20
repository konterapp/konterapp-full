import { errorResponse, successResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { userService } from "@/lib/modules/users/admin.service";

export const GET = withAuth(async () => {
  try {
    const roles = await userService.getRoles();
    return successResponse("Roles retrieved successfully", roles);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
