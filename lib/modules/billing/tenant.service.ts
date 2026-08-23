import { v7 as uuidv7 } from "uuid";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { formatSubscription, formatInvoice, isInvoiceExpired } from "./billing.mapper";
import { createSnapTransaction } from "./midtrans-client";
import { INVOICE_PAYMENT_EXPIRY_HOURS, FREE_PLAN_CODE } from "./constants";
import { couponRepository } from "@/lib/modules/coupon/repository";
import { referralService } from "@/lib/modules/referral/referral.service";

export const billingTenantService = {
  async getBillingStatus(companyUuid: string, userId?: number) {
    const [subscription, invoices, user] = await Promise.all([
      billingRepository.findSubscriptionByCompanyUuid(companyUuid),
      billingRepository.listInvoicesByCompanyUuid(companyUuid),
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { referralBalance: true, referredByUserId: true },
          })
        : Promise.resolve(null),
    ]);

    return {
      subscription: formatSubscription(subscription),
      invoices: invoices.map(formatInvoice),
      referral_balance: user ? Number(user.referralBalance) : 0,
      referred_by: user?.referredByUserId ?? null,
    };
  },

  async createCheckoutInvoice(
    companyUuid: string,
    userId: number,
    planCode: string,
    couponCode?: string | null,
    redirectUrl?: string,
    useReferralBalance?: boolean
  ) {
    const [company, user, plan, subscription, invoices] = await Promise.all([
      prisma.company.findUnique({ where: { uuid: companyUuid } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, referralBalance: true } }),
      billingRepository.findPlanByCode(planCode),
      billingRepository.findSubscriptionByCompanyUuid(companyUuid),
      billingRepository.listInvoicesByCompanyUuid(companyUuid),
    ]);

    if (!company) {
      throw new ApiError("Perusahaan tidak ditemukan", 404);
    }
    if (!user) {
      throw new ApiError("User tidak ditemukan", 404);
    }
    if (!plan) {
      throw new ApiError("Paket tidak ditemukan", 404);
    }

    // Cegah pembayaran ganda: langganan sudah aktif pada paket berbayar.
    // (Akun Free permanen statusnya 'active' tapi tetap boleh upgrade ke paket berbayar.)
    if (subscription?.status === "active" && subscription.plan?.code !== FREE_PLAN_CODE) {
      throw new ApiError("Langganan Anda sudah aktif, tidak perlu melakukan pembayaran lagi.", 400);
    }

    // Jika masih ada invoice pending yang belum lewat masa bayarnya, pakai ulang
    // invoice tersebut alih-alih membuat yang baru (hindari checkout ganda).
    const validPendingInvoice = invoices.find(
      (invoice) =>
        invoice.status === "pending" &&
        !isInvoiceExpired(invoice) &&
        invoice.planUuid === plan.uuid
    );
    if (validPendingInvoice) {
      return formatInvoice(validPendingInvoice);
    }

    // Invoice pending lama yang sudah kedaluwarsa ditandai expired.
    for (const invoice of invoices) {
      if (invoice.status === "pending" && isInvoiceExpired(invoice)) {
        await billingRepository.markInvoiceExpired(invoice.uuid);
      }
    }

    // Apakah ini pembayaran pertama perusahaan? (belum ada invoice paid)
    const isFirstPaidSub = !invoices.some((inv) => inv.status === "paid");

    // Resolver diskon terpadu: referral (10% untuk pembayaran pertama) atau kupon.
    const promo = await referralService.resolveCheckoutPromo({
      couponCode,
      buyerUserId: userId,
      companyUuid,
      plan,
      isFirstPaidSub,
    });

    // Saat diskon referral dari kode manual, catat siapa referrer-nya.
    let amountAfterDiscount = promo.finalAmount;
    let invoiceCouponCode: string | null = null;
    let invoiceDiscountAmount: number | null = null;
    let invoiceReferralCode: string | null = null;
    let invoiceReferralDiscountAmount: number | null = null;
    let promoCouponUuid: string | null = null;
    let setReferredBy: number | null = null;

    if (promo.type === "referral") {
      invoiceReferralCode = promo.referralCode;
      invoiceReferralDiscountAmount = promo.discountAmount;
      if (promo.setReferredBy) {
        setReferredBy = promo.referrerUserId;
      }
    } else if (promo.type === "coupon") {
      invoiceCouponCode = promo.couponCode;
      invoiceDiscountAmount = promo.discountAmount;
      promoCouponUuid = promo.couponUuid;
    }

    // Opsi pakai saldo referral untuk mengurangi pembayaran (renewal dsb).
    const balance = Number(user.referralBalance);
    const saldoUsed = referralService.computeSaldoUsage(
      balance,
      amountAfterDiscount,
      Boolean(useReferralBalance)
    );
    if (saldoUsed > 0) {
      amountAfterDiscount = Math.max(amountAfterDiscount - saldoUsed, 0);
    }

    const grossAmount = amountAfterDiscount;

    const orderId = `sub-${uuidv7()}`;
    const now = new Date();

    const snapTransaction = await createSnapTransaction({
      orderId,
      grossAmount,
      customerName: user.name,
      customerEmail: user.email,
      itemName: `Paket ${plan.name} - ${company.name}`,
      redirectUrl,
    });

    const invoice = await billingRepository.runInTransaction(async (tx) => {
      const createdInvoice = await billingRepository.createInvoice(tx, {
        companyUuid: company.uuid,
        planUuid: plan.uuid,
        provider: "midtrans",
        providerInvoiceId: orderId,
        amount: grossAmount,
        userId,
        couponCode: invoiceCouponCode,
        discountAmount: invoiceDiscountAmount,
        referralCode: invoiceReferralCode,
        referralDiscountAmount: invoiceReferralDiscountAmount,
        referralBalanceUsed: saldoUsed > 0 ? saldoUsed : null,
        paymentLink: snapTransaction.redirect_url,
        expiredAt: new Date(now.getTime() + INVOICE_PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000),
      });

      // Klaim kuota kupon setelah invoice berhasil dibuat (reservasi pemakaian).
      if (promoCouponUuid) {
        await tx.coupon.update({
          where: { uuid: promoCouponUuid },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Catat referrer bila referral kode dimasukkan manual saat checkout.
      if (setReferredBy) {
        await tx.user.update({
          where: { id: userId },
          data: { referredByUserId: setReferredBy },
        });
      }

      return createdInvoice;
    });

    return formatInvoice(invoice);
  },

  async cancelInvoice(companyUuid: string, invoiceUuid: string) {
    const invoice = await billingRepository.findInvoiceByCompanyAndUuid(companyUuid, invoiceUuid);
    if (!invoice) {
      throw new ApiError("Invoice tidak ditemukan", 404);
    }
    if (invoice.status !== "pending") {
      throw new ApiError("Invoice ini tidak dapat dibatalkan", 400);
    }
    if (isInvoiceExpired(invoice)) {
      throw new ApiError("Invoice sudah kedaluwarsa", 400);
    }

    const updated = await billingRepository.markInvoiceExpired(invoice.uuid);

    // Lepaskan reservasi kuota kupon yang sudah diklaim di invoice ini.
    if (invoice.couponCode) {
      const coupon = await couponRepository.findByCode(invoice.couponCode);
      if (coupon) {
        await couponRepository.decrementUsedCount(coupon.uuid);
      }
    }

    return formatInvoice(updated);
  },
};
