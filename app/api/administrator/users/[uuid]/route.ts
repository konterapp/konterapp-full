import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { updateUserSchema } from "@/lib/validations/user";
import { userService } from "@/lib/modules/users/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const result = await userService.getUserDetail(uuid);
    return successResponse("User retrieved successfully", result);
  })
);

export const PATCH = withAdministratorAuth(
  withApiErrorHandling(async (req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const contentType = req.headers.get("content-type") ?? "";
    let body: any;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      if (body.roles) body.roles = Number(body.roles);
    } else {
      body = await req.json();
    }

    const validated = validateSchema(updateUserSchema, body);
    if (!("data" in validated)) return validated;

    const result = await userService.updateUser(uuid, validated.data);
    return successResponse("User updated successfully", result);
  })
);

export const DELETE = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    await userService.deleteUser(uuid);
    return successResponse("User deleted successfully");
  })
);
