import { successResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { userService } from "@/lib/modules/users/admin.service";

export const GET = withAuth(
  withApiErrorHandling(async () => {
    const roles = await userService.getRoles();

    return successResponse("Roles retrieved successfully", roles);
  })
);
