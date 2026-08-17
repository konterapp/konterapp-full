import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { couponCodeSchema } from "@/lib/validations/coupon";
import { resolveCouponForCheckout } from "@/lib/modules/coupon/coupon.service";
import { billingRepository } from "@/lib/modules/billing/repository";
import { prisma } from "@/lib/prisma";
import { STARTER_YEARLY_PLAN_CODE } from "@/lib/modules/billing/constants";
import { REFERRAL_DISCOUNT_PERCENT } from "@/lib/modules/referral/constants";

const applyCouponSchema = couponCodeSchema.extend({
  plan_code: z
    .string()
    .trim()
    .min(1, "Paket wajib diisi")
    .max(50, "Paket maksimal 50 karakter")
    .default(STARTER_YEARLY_PLAN_CODE),
});

export const POST = withAuth(
  withApiErrorHandling(async (req, context) => {
    const body = await req.json().catch(() => ({}));
    const result = validateSchema(applyCouponSchema, body);
    if (!("data" in result)) return result;

    const plan = await billingRepository.findPlanByCode(result.data.plan_code);
    if (!plan) {
      return errorResponse("Paket tidak ditemukan", 404);
    }

    const subtotal = Number(plan.price);

    // Coba resolve sebagai kode referral dulu (diskon 10% untuk pembayaran
    // pertama referral), lalu fallback ke kupon biasa.
    const buyer = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { referredByUserId: true },
    });
    const invoices = await billingRepository.listInvoicesByCompanyUuid(context.companyUuid);
    const isFirstPaidSub = !invoices.some((i) => i.status === "paid");

    // Referral otomatis: user sudah punya referrer & ini pembayaran pertama.
    if (buyer?.referredByUserId && isFirstPaidSub) {
      const referrer = await prisma.user.findUnique({
        where: { id: buyer.referredByUserId, deletedAt: null },
        select: { referralCode: true },
      });
      if (referrer?.referralCode) {
        const discountAmount = Math.round((subtotal * REFERRAL_DISCOUNT_PERCENT) / 100);
        return successResponse("Diskon referral aktif", {
          code: referrer.referralCode,
          name: "Diskon Referral",
          plan_code: null,
          discount_percent: REFERRAL_DISCOUNT_PERCENT,
          discount_amount: discountAmount,
          subtotal,
          final_amount: Math.max(subtotal - discountAmount, 0),
          is_referral: true,
          auto: true,
        });
      }
    }

    // Referral manual: kode dimasukkan & valid (hanya bila belum punya referrer & first sub).
    if (!buyer?.referredByUserId && isFirstPaidSub) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: result.data.code.trim().toUpperCase(), deletedAt: null, isActive: true },
        select: { id: true, referralCode: true, name: true },
      });
      if (referrer && referrer.id !== context.userId) {
        const discountAmount = Math.round((subtotal * REFERRAL_DISCOUNT_PERCENT) / 100);
        return successResponse("Kode referral valid", {
          code: referrer.referralCode,
          name: `Referral ${referrer.name}`,
          plan_code: null,
          discount_percent: REFERRAL_DISCOUNT_PERCENT,
          discount_amount: discountAmount,
          subtotal,
          final_amount: Math.max(subtotal - discountAmount, 0),
          is_referral: true,
          auto: false,
        });
      }
    }

    const { coupon, discountAmount, finalAmount } = await resolveCouponForCheckout(
      result.data.code,
      subtotal,
      plan
    );

    return successResponse("Kupon berhasil digunakan", {
      code: coupon.code,
      name: coupon.name,
      plan_code: coupon.planCode,
      discount_percent: Number(coupon.discountPercent),
      discount_amount: discountAmount,
      subtotal,
      final_amount: finalAmount,
      is_referral: false,
      auto: false,
    });
  })
);
