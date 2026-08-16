import { paginatedResponse, successResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { createRoleSchema } from "@/lib/validations/role";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { roleService } from "@/lib/modules/roles/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (req) => {
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
  })
);

export const POST = withAdministratorAuth(
  withApiErrorHandling(async (req) => {
    const body = await req.json();

    const result = validateSchema(createRoleSchema, body);
    if (!("data" in result)) return result;

    const created = await roleService.createRole(result.data);
    return successResponse("Role created successfully", created, 201);
  })
);
