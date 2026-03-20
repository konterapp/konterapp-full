import { errorResponse, successResponse, validationError } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { updateRoleSchema } from "@/lib/validations/role";
import { roleService } from "@/lib/modules/roles/admin.service";

function parseRoleId(rawId?: string) {
  if (!rawId) return null;
  const id = Number(rawId);
  if (Number.isNaN(id)) return null;
  return id;
}

export const GET = withPermission("admin.role.index", async (_req, context) => {
  try {
    const params = await context.params;
    const id = parseRoleId(params.id);

    if (id === null) {
      return errorResponse("Invalid role ID", 400);
    }

    const result = await roleService.getRoleDetail(id);
    if (!result.ok) {
      return errorResponse(result.message ?? "Failed to fetch role", result.statusCode);
    }

    return successResponse("Role retrieved successfully", result.data);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const PATCH = withPermission("admin.role.update", async (req, context) => {
  try {
    const params = await context.params;
    const id = parseRoleId(params.id);

    if (id === null) {
      return errorResponse("Invalid role ID", 400);
    }

    const body = await req.json();

    const validated = validateSchema(updateRoleSchema, body);
    if (!("data" in validated)) return validated;

    const result = await roleService.updateRole({
      id,
      name: validated.data.name,
      permissions: validated.data.permissions,
    });

    if (!result.ok && result.statusCode === 422) {
      return validationError(result.errors);
    }

    if (!result.ok) {
      return errorResponse(result.message, result.statusCode);
    }

    return successResponse(result.message ?? "Role updated successfully", result.data);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const DELETE = withPermission("admin.role.delete", async (_req, context) => {
  try {
    const params = await context.params;
    const id = parseRoleId(params.id);

    if (id === null) {
      return errorResponse("Invalid role ID", 400);
    }

    const result = await roleService.deleteRole(id);
    if (!result.ok) {
      return errorResponse(result.message ?? "Failed to delete role", result.statusCode);
    }

    return successResponse(result.message ?? "Role deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
