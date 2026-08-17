import { ApiError } from "@/lib/api-errors";
import { couponRepository } from "./repository";
import type { Coupon as CouponRecord } from "@prisma/client";

export function computeCouponDiscount(coupon: CouponRecord, subtotal: number): number {
  let discount = (subtotal * Number(coupon.discountPercent)) / 100;
  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, Number(coupon.maxDiscount));
  }
  return Math.round(discount);
}

interface PlanContext {
  code: string;
  tier?: { code: string } | null;
}

/**
 * Kupon cocok dengan paket jika plan_code kupon kosong (semua paket),
 * sama dengan kode paket, atau sama dengan kode tier paket.
 */
export function couponMatchesPlan(couponPlanCode: string | null | undefined, plan: PlanContext | null | undefined): boolean {
  if (!couponPlanCode) return true;
  if (!plan) return false;
  if (couponPlanCode === plan.code) return true;
  if (plan.tier && couponPlanCode === plan.tier.code) return true;
  return false;
}

/**
 * Validasi kupon dan hitung diskon untuk nominal subtotal tertentu.
 * Melakukan pengecekan status, periode berlaku, kuota pemakaian, dan
 * kecocokan paket (planCode kupon kosong berarti berlaku untuk semua paket;
 * planCode bisa berupa kode tier atau kode paket).
 */
export async function resolveCouponForCheckout(code: string, subtotal: number, plan?: PlanContext | null) {
  const coupon = await couponRepository.findByCode(code);
  if (!coupon) {
    throw new ApiError("Kode kupon tidak valid", 404);
  }

  const now = new Date();
  if (!coupon.isActive) {
    throw new ApiError("Kupon sudah tidak aktif", 400);
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    throw new ApiError("Kupon belum bisa digunakan", 400);
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    throw new ApiError("Kupon sudah kedaluwarsa", 400);
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError("Kuota pemakaian kupon sudah habis", 400);
  }
  if (!couponMatchesPlan(coupon.planCode, plan)) {
    throw new ApiError("Kupon ini hanya berlaku untuk paket tertentu", 400);
  }

  const discountAmount = computeCouponDiscount(coupon, subtotal);
  const finalAmount = subtotal - discountAmount;
  if (finalAmount <= 0) {
    throw new ApiError("Diskon kupon melebihi harga paket", 400);
  }

  return { coupon, discountAmount, finalAmount };
}
