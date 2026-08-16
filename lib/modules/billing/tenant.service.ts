import { v7 as uuidv7 } from "uuid";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { formatSubscription, formatInvoice, isInvoiceExpired } from "./billing.mapper";
import { createSnapTransaction } from "./midtrans-client";
import { INVOICE_PAYMENT_EXPIRY_HOURS } from "./constants";
import { resolveCouponForCheckout } from "@/lib/modules/coupon/coupon.service";
import { couponRepository } from "@/lib/modules/coupon/repository";

export const billingTenantService = {
  async getBillingStatus(companyUuid: string) {
    const [subscription, invoices] = await Promise.all([
      billingRepository.findSubscriptionByCompanyUuid(companyUuid),
      billingRepository.listInvoicesByCompanyUuid(companyUuid),
    ]);

    return {
      subscription: formatSubscription(subscription),
      invoices: invoices.map(formatInvoice),
    };
  },

  async createCheckoutInvoice(
    companyUuid: string,
    userId: number,
    planCode: string,
    couponCode?: string | null,
    redirectUrl?: string
  ) {
    const [company, user, plan, subscription, invoices] = await Promise.all([
      prisma.company.findUnique({ where: { uuid: companyUuid } }),
      prisma.user.findUnique({ where: { id: userId } }),
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

    // Cegah pembayaran ganda: langganan sudah aktif.
    if (subscription?.status === "active") {
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

    let grossAmount = Number(plan.price);
    let appliedCoupon: { code: string; discountAmount: number; couponUuid: string } | null = null;

    if (couponCode) {
      const resolved = await resolveCouponForCheckout(couponCode, grossAmount, plan.code);
      appliedCoupon = {
        code: resolved.coupon.code,
        discountAmount: resolved.discountAmount,
        couponUuid: resolved.coupon.uuid,
      };
      grossAmount = resolved.finalAmount;
    }

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

    const invoice = await billingRepository.createInvoice({
      companyUuid: company.uuid,
      planUuid: plan.uuid,
      provider: "midtrans",
      providerInvoiceId: orderId,
      amount: grossAmount,
      couponCode: appliedCoupon?.code ?? null,
      discountAmount: appliedCoupon?.discountAmount ?? null,
      paymentLink: snapTransaction.redirect_url,
      expiredAt: new Date(now.getTime() + INVOICE_PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000),
    });

    // Klaim kuota kupon setelah invoice berhasil dibuat (reservasi pemakaian).
    if (appliedCoupon) {
      await prisma.coupon.update({
        where: { uuid: appliedCoupon.couponUuid },
        data: { usedCount: { increment: 1 } },
      });
    }

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
