import { successResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { updateCouponSchema } from "@/lib/validations/coupon";
import { couponAdminService } from "@/lib/modules/coupon/admin.service";

export const GET = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const result = await couponAdminService.getCouponDetail(uuid);
    return successResponse("Detail Kupon", result);
  })
);

export const PATCH = withAdministratorAuth(
  withApiErrorHandling(async (req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    const body = await req.json();
    const result = validateSchema(updateCouponSchema, body);
    if (!("data" in result)) return result;

    const updated = await couponAdminService.updateCoupon(uuid, result.data);
    return successResponse("Kupon berhasil diperbarui", updated);
  })
);

export const DELETE = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const params = await context.params;
    const uuid = params.uuid;

    await couponAdminService.deleteCoupon(uuid);
    return successResponse("Kupon berhasil dihapus");
  })
);
