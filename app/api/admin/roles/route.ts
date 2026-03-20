import { paginatedResponse, errorResponse, successResponse, validationError } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { createRoleSchema } from "@/lib/validations/role";
import { withPermission } from "@/lib/api-middleware";
import { roleService } from "@/lib/modules/roles/admin.service";

export const GET = withPermission("admin.role.index", async (req) => {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "id";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";

    const result = await roleService.listRoles({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
    });

    return paginatedResponse("List Role", result.roles, {
      currentPage: result.page,
      perPage: result.perPage,
      total: result.total,
      path: url.pathname,
    });
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const POST = withPermission("admin.role.create", async (req) => {
  try {
    const body = await req.json();

    const result = validateSchema(createRoleSchema, body);
    if (!("data" in result)) return result;

    const created = await roleService.createRole(result.data);

    if (!created.ok && created.statusCode === 422) {
      return validationError(created.errors);
    }

    if (!created.ok) {
      return errorResponse(created.message, created.statusCode);
    }

    return successResponse(created.message ?? "Role created successfully", created.data, 201);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
