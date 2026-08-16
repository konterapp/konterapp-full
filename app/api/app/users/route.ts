import { paginatedResponse, successResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { createUserSchema } from "@/lib/validations/user";
import { userService } from "@/lib/modules/users/admin.service";

export const GET = withPermission(
  "admin.user.index",
  withApiErrorHandling(async (req) => {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "id";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";
    const role = url.searchParams.get("role") ?? "";
    const source = url.searchParams.get("source") ?? "";

    const result = await userService.listUsers({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
      role,
      source,
    });

    return paginatedResponse("List User", result.users, {
      currentPage: result.page,
      perPage: result.perPage,
      total: result.total,
      path: url.pathname,
    });
  })
);

export const POST = withPermission(
  "admin.user.create",
  withApiErrorHandling(async (req, context) => {
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

    const validated = validateSchema(createUserSchema, body);
    if (!("data" in validated)) return validated;

    const created = await userService.createUser(validated.data, profilePhotoFile, context.companyUuid);
    return successResponse("User created successfully", created, 201);
  })
);
