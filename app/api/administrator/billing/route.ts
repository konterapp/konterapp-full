import { paginatedResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { billingAdminService } from "@/lib/modules/billing/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (req) => {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "created_at";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";

    const result = await billingAdminService.listInvoices({
      page,
      perPage,
      search,
      status,
      sortBy,
      sortOrder,
    });

    return paginatedResponse("List Transaksi Billing", result.invoices, {
      currentPage: result.page,
      perPage: result.perPage,
      total: result.total,
      path: url.pathname,
    });
  })
);
