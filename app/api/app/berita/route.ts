import { successResponse, paginatedResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { createBeritaSchema } from "@/lib/validations/berita";
import { beritaService } from "@/lib/modules/berita/admin.service";
import { withApiErrorHandling } from "@/lib/api-error-handler";

export const GET = withPermission(
  "berita.index",
  withApiErrorHandling(async (req) => {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "id";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";
    const isPublished = url.searchParams.get("is_published");

    const result = await beritaService.listBerita({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
      isPublished,
    });

    return paginatedResponse("List Berita", result.items, {
      currentPage: result.page,
      perPage: result.perPage,
      total: result.total,
      path: url.pathname,
    });
  })
);

export const POST = withPermission(
  "berita.create",
  withApiErrorHandling(async (req, context) => {
    const contentType = req.headers.get("content-type") ?? "";
    let body: any;
    let imageFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      imageFile = formData.get("image") as File | null;
    } else {
      body = await req.json();
    }

    const result = validateSchema(createBeritaSchema, body);
    if (!("data" in result)) return result;

    const created = await beritaService.createBerita(result.data, imageFile, context.userId);
    return successResponse("Berita berhasil dibuat", created, 201);
  })
);
