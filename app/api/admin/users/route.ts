import { paginatedResponse, errorResponse, successResponse, validationError } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { createUserSchema } from "@/lib/validations/user";
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

export const GET = withPermission("admin.user.index", async (req) => {
  try {
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
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const POST = withPermission("admin.user.create", async (req) => {
  try {
    const { body, profilePhotoFile } = await parseUserPayload(req);

    const parsed = validateSchema(createUserSchema, body);
    if (!("data" in parsed)) return parsed;

    const result = await userService.createUser(parsed.data, profilePhotoFile);

    if (!result.ok) {
      if (result.statusCode === 422 && "errors" in result) {
        return validationError(result.errors);
      }
      return errorResponse(result.message ?? "Internal server error", result.statusCode);
    }

    return successResponse(result.message ?? "User created successfully", result.data, 201);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
