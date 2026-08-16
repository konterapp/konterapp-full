import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { ApiError } from "@/lib/api-errors";
import { validateSchema } from "@/lib/validation";
import { updateRoleSchema } from "@/lib/validations/role";
import { roleService } from "@/lib/modules/roles/admin.service";

function parseRoleId(rawId?: string) {
  if (!rawId) {
    throw new ApiError("Invalid role ID", 400);
  }

  const id = Number(rawId);
  if (Number.isNaN(id)) {
    throw new ApiError("Invalid role ID", 400);
  }

  return id;
}

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const id = parseRoleId(params.id);

    const result = await roleService.getRoleDetail(id);
    return successResponse("Role retrieved successfully", result);
  })
);

export const PATCH = withAdministratorAuth(
  withApiErrorHandling(async (req, context) => {
    const params = await context.params;
    const id = parseRoleId(params.id);

    const body = await req.json();
    const validated = validateSchema(updateRoleSchema, body);
    if (!("data" in validated)) return validated;

    const result = await roleService.updateRole({
      id,
      name: validated.data.name,
      permissions: validated.data.permissions,
    });

    return successResponse("Role updated successfully", result);
  })
);

export const DELETE = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const id = parseRoleId(params.id);

    await roleService.deleteRole(id);
    return successResponse("Role deleted successfully");
  })
);
