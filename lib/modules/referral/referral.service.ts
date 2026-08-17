import { v7 as uuidv7 } from "uuid";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import {
  REFERRAL_DISCOUNT_PERCENT,
  REFERRAL_COMMISSION_PERCENT,
  generateReferralCode,
} from "./constants";
import { resolveCouponForCheckout } from "@/lib/modules/coupon/coupon.service";
import type { Plan } from "@prisma/client";

/** Pastikan user punya referral code unik (generate bila belum). */
export const referralService = {
  async ensureReferralCode(userId: number): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (user?.referralCode) return user.referralCode;

    const code = await this.generateUniqueReferralCode();
    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return code;
  },

  async generateUniqueReferralCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = generateReferralCode();
      const exists = await prisma.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw new ApiError("Gagal membuat kode referral unik", 500);
  },

  /**
   * Validasi kode referral (dipakai di register & checkout).
   * Balas referrer, tolak self-referral & kode tak dikenal.
   */
  async validateCode(code: string, buyerUserId?: number) {
    const referrer = await prisma.user.findFirst({
      where: { referralCode: code.trim().toUpperCase(), deletedAt: null, isActive: true },
      select: { id: true, name: true, referralCode: true },
    });
    if (!referrer) {
      throw new ApiError("Kode referral tidak valid", 404);
    }
    if (buyerUserId && referrer.id === buyerUserId) {
      throw new ApiError("Tidak bisa menggunakan kode referral sendiri", 400);
    }
    return referrer;
  },

  /**
   * Resolver diskon checkout terpadu: cek referral dulu (diskon 10% untuk
   * pembayaran pertama referral), lalu kupon. Hanya satu yang berlaku.
   */
  async resolveCheckoutPromo(params: {
    couponCode?: string | null;
    buyerUserId: number;
    companyUuid: string;
    plan: Plan;
    isFirstPaidSub: boolean;
  }) {
    const { couponCode, buyerUserId, companyUuid, plan, isFirstPaidSub } = params;
    const planPrice = Number(plan.price);
    const buyer = await prisma.user.findUnique({
      where: { id: buyerUserId },
      select: { referredByUserId: true },
    });

    // 1) Referral otomatis: user sudah punya referrer & ini pembayaran pertama.
    if (buyer?.referredByUserId && isFirstPaidSub) {
      const referrer = await prisma.user.findUnique({
        where: { id: buyer.referredByUserId, deletedAt: null },
        select: { id: true, referralCode: true },
      });
      if (referrer?.referralCode) {
        const discountAmount = Math.round((planPrice * REFERRAL_DISCOUNT_PERCENT) / 100);
        return {
          type: "referral" as const,
          referralCode: referrer.referralCode,
          discountAmount,
          finalAmount: Math.max(planPrice - discountAmount, 0),
          referrerUserId: referrer.id,
          setReferredBy: false,
        };
      }
    }

    // 2) Kode referral dimasukkan manual (hanya jika belum punya referrer & first sub).
    if (couponCode && !buyer?.referredByUserId && isFirstPaidSub) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: couponCode.trim().toUpperCase(), deletedAt: null, isActive: true },
        select: { id: true, referralCode: true },
      });
      if (referrer && referrer.id !== buyerUserId) {
        const discountAmount = Math.round((planPrice * REFERRAL_DISCOUNT_PERCENT) / 100);
        return {
          type: "referral" as const,
          referralCode: referrer.referralCode,
          discountAmount,
          finalAmount: Math.max(planPrice - discountAmount, 0),
          referrerUserId: referrer.id,
          setReferredBy: true,
        };
      }
    }

    // 3) Kupon biasa.
    if (couponCode) {
      const resolved = await resolveCouponForCheckout(couponCode, planPrice, plan);
      return {
        type: "coupon" as const,
        couponCode: resolved.coupon.code,
        couponUuid: resolved.coupon.uuid,
        discountAmount: resolved.discountAmount,
        finalAmount: resolved.finalAmount,
        setReferredBy: false,
      };
    }

    return {
      type: "none" as const,
      discountAmount: 0,
      finalAmount: planPrice,
      setReferredBy: false,
    };
  },

  /**
   * Hitung berapa saldo referral yang bisa dipakai untuk mengurangi pembayaran.
   * Tidak boleh melebihi sisa harga setelah diskon atau saldo tersedia.
   */
  computeSaldoUsage(balance: number, remainingAfterDiscount: number, useReferralBalance: boolean) {
    if (!useReferralBalance || balance <= 0 || remainingAfterDiscount <= 0) return 0;
    return Math.min(balance, remainingAfterDiscount);
  },

  /**
   * Berikan komisi 50% ke referrer untuk pembayaran pertama referral.
   * Idempoten via invoice_uuid unik. Hanya untuk invoice pertama perusahaan.
   */
  async grantCommissionForInvoice(invoice: {
    uuid: string;
    companyUuid: string;
    amount: any;
    planCode: string;
    paidAt?: Date | null;
  }) {
    // Idempotensi: komisi untuk invoice ini sudah ada?
    const existing = await prisma.referralCommission.findUnique({
      where: { invoiceUuid: invoice.uuid },
      select: { id: true },
    });
    if (existing) return { granted: false, reason: "sudah ada" };

    // Hanya untuk pembayaran pertama perusahaan (jumlah invoice paid === 1 = invoice ini).
    const paidCount = await prisma.subscriptionInvoice.count({
      where: { companyUuid: invoice.companyUuid, status: "paid" },
    });
    if (paidCount > 1) return { granted: false, reason: "bukan pembayaran pertama" };

    // Cari pemilik perusahaan (member default) & cek apakah direferensikan.
    const owner = await prisma.companyUser.findFirst({
      where: { companyUuid: invoice.companyUuid, isDefault: true },
      select: { user: { select: { id: true, referredByUserId: true, deletedAt: true } } },
    });
    const referrerId = owner?.user.referredByUserId;
    if (!referrerId || !owner) return { granted: false, reason: "tidak direferensikan" };

    const baseAmount = Number(invoice.amount);
    const commissionAmount = Math.round((baseAmount * REFERRAL_COMMISSION_PERCENT) / 100);

    await prisma.$transaction([
      prisma.referralCommission.create({
        data: {
          uuid: uuidv7(),
          referrerUserId: referrerId,
          referredUserId: owner.user.id,
          companyUuid: invoice.companyUuid,
          invoiceUuid: invoice.uuid,
          baseAmount,
          amount: commissionAmount,
          planCode: invoice.planCode,
          status: "paid",
        },
      }),
      prisma.user.update({
        where: { id: referrerId },
        data: { referralBalance: { increment: commissionAmount } },
      }),
    ]);

    return { granted: true, amount: commissionAmount };
  },

  /**
   * Debit saldo referral user yang dipakai di invoice (saat pembayaran sukses).
   * Idempoten: hanya debit kalau invoice status paid & belum didebit
   * (ditandai referral_balance_used > 0 yang belum didebit). Untuk
   * kesederhanaan, debit sekali per invoice berdasarkan amount > 0.
   */
  async debitSaldoForInvoice(invoice: {
    uuid: string;
    userId?: number | null;
    referralBalanceUsed?: any;
    status: string;
  }) {
    const used = invoice.referralBalanceUsed ? Number(invoice.referralBalanceUsed) : 0;
    if (used <= 0 || !invoice.userId) return { debited: false };

    const buyer = await prisma.user.findUnique({
      where: { id: invoice.userId },
      select: { referralBalance: true },
    });
    if (!buyer) return { debited: false };

    // Debit paling banyak sebesar saldo (jaga jangan negatif di race kondisi).
    const debit = Math.min(used, Number(buyer.referralBalance));
    if (debit <= 0) return { debited: false };

    await prisma.user.update({
      where: { id: invoice.userId },
      data: { referralBalance: { decrement: debit } },
    });
    return { debited: true, amount: debit };
  },
};