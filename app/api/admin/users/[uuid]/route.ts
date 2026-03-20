import { successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { updateUserSchema } from "@/lib/validations/user";
import { userService } from "@/lib/modules/users/admin.service";

export const GET = withPermission(
  "admin.user.index",
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const result = await userService.getUserDetail(uuid);
    return successResponse("User retrieved successfully", result);
  })
);

export const PATCH = withPermission(
  "admin.user.update",
  withApiErrorHandling(async (req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const contentType = req.headers.get("content-type") ?? "";
    let body: any;
    let profilePhotoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      profilePhotoFile = formData.get("profile_photo") as File | null;
      if (body.roles) body.roles = Number(body.roles);
      if (body.province_id) body.province_id = Number(body.province_id);
      if (body.city_id) body.city_id = Number(body.city_id);
    } else {
      body = await req.json();
    }

    const validated = validateSchema(updateUserSchema, body);
    if (!("data" in validated)) return validated;

    const result = await userService.updateUser(uuid, validated.data, profilePhotoFile);
    return successResponse("User updated successfully", result);
  })
);

export const DELETE = withPermission(
  "admin.user.delete",
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    await userService.deleteUser(uuid);
    return successResponse("User deleted successfully");
  })
);
