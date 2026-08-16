import type { Coupon as CouponRecord } from "@prisma/client";

export function formatCoupon(coupon: CouponRecord) {
  return {
    uuid: coupon.uuid,
    code: coupon.code,
    name: coupon.name,
    description: coupon.description,
    plan_code: coupon.planCode,
    discount_percent: Number(coupon.discountPercent),
    max_discount: coupon.maxDiscount != null ? Number(coupon.maxDiscount) : null,
    usage_limit: coupon.usageLimit,
    used_count: coupon.usedCount,
    is_active: coupon.isActive,
    starts_at: coupon.startsAt,
    expires_at: coupon.expiresAt,
    created_at: coupon.createdAt,
    updated_at: coupon.updatedAt,
  };
}
