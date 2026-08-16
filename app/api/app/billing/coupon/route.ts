import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { couponCodeSchema } from "@/lib/validations/coupon";
import { resolveCouponForCheckout } from "@/lib/modules/coupon/coupon.service";
import { billingRepository } from "@/lib/modules/billing/repository";
import { YEARLY_PLAN_CODE } from "@/lib/modules/billing/constants";

const applyCouponSchema = couponCodeSchema.extend({
  plan_code: z
    .string()
    .trim()
    .min(1, "Paket wajib diisi")
    .max(50, "Paket maksimal 50 karakter")
    .default(YEARLY_PLAN_CODE),
});

export const POST = withAuth(
  withApiErrorHandling(async (req) => {
    const body = await req.json().catch(() => ({}));
    const result = validateSchema(applyCouponSchema, body);
    if (!("data" in result)) return result;

    const plan = await billingRepository.findPlanByCode(result.data.plan_code);
    if (!plan) {
      return errorResponse("Paket tidak ditemukan", 404);
    }

    const subtotal = Number(plan.price);
    const { coupon, discountAmount, finalAmount } = await resolveCouponForCheckout(
      result.data.code,
      subtotal,
      result.data.plan_code
    );

    return successResponse("Kupon berhasil digunakan", {
      code: coupon.code,
      name: coupon.name,
      plan_code: coupon.planCode,
      discount_percent: Number(coupon.discountPercent),
      discount_amount: discountAmount,
      subtotal,
      final_amount: finalAmount,
    });
  })
);
