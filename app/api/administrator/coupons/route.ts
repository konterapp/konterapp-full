import { paginatedResponse, successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { createCouponSchema } from "@/lib/validations/coupon";
import { couponAdminService } from "@/lib/modules/coupon/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (req) => {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "created_at";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";

    const result = await couponAdminService.listCoupons({
      page,
      perPage,
      search,
      status,
      sortBy,
      sortOrder,
    });

    return paginatedResponse("List Kupon", result.coupons, {
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

    const result = validateSchema(createCouponSchema, body);
    if (!("data" in result)) return result;

    const created = await couponAdminService.createCoupon(result.data);
    return successResponse("Kupon berhasil dibuat", created, 201);
  })
);
