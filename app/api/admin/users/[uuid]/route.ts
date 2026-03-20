import { errorResponse, successResponse, validationError } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { updateUserSchema } from "@/lib/validations/user";
import { userService } from "@/lib/modules/users/admin.service";

async function parseUserPayload(req: Request) {
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

  return { body, profilePhotoFile };
}

export const GET = withPermission("admin.user.index", async (_req, context) => {
  try {
    const params = await context.params;
    const result = await userService.getUserDetail(params.uuid);

    if (!result.ok) {
      return errorResponse(result.message ?? "Internal server error", result.statusCode);
    }

    return successResponse("User retrieved successfully", result.data);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const PATCH = withPermission("admin.user.update", async (req, context) => {
  try {
    const params = await context.params;
    const { body, profilePhotoFile } = await parseUserPayload(req);

    const parsed = validateSchema(updateUserSchema, body);
    if (!("data" in parsed)) return parsed;

    const result = await userService.updateUser(params.uuid, parsed.data, profilePhotoFile);

    if (!result.ok) {
      if (result.statusCode === 422 && "errors" in result) {
        return validationError(result.errors);
      }
      return errorResponse(result.message ?? "Internal server error", result.statusCode);
    }

    return successResponse(result.message ?? "User updated successfully", result.data);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const DELETE = withPermission("admin.user.delete", async (_req, context) => {
  try {
    const params = await context.params;
    const result = await userService.deleteUser(params.uuid);

    if (!result.ok) {
      return errorResponse(result.message ?? "Internal server error", result.statusCode);
    }

    return successResponse(result.message ?? "User deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
