import { paginatedResponse, successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { createCompanySchema } from "@/lib/validations/company";
import { companyService } from "@/lib/modules/company/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (req) => {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "created_at";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";

    const result = await companyService.listCompanies({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
    });

    return paginatedResponse("List Perusahaan", result.companies, {
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

    const result = validateSchema(createCompanySchema, body);
    if (!("data" in result)) return result;

    const created = await companyService.createCompany(result.data);
    return successResponse("Perusahaan berhasil dibuat", created, 201);
  })
);
