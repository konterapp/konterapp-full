import { v7 as uuidv7 } from "uuid";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { formatSubscription, formatInvoice } from "./billing.mapper";
import { createSnapTransaction } from "./midtrans-client";
import { YEARLY_PLAN_CODE } from "./constants";

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

  async createCheckoutInvoice(companyUuid: string, userId: number) {
    const [company, user, plan] = await Promise.all([
      prisma.company.findUnique({ where: { uuid: companyUuid } }),
      prisma.user.findUnique({ where: { id: userId }, include: { profile: true } }),
      billingRepository.findPlanByCode(YEARLY_PLAN_CODE),
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

    const orderId = `sub-${uuidv7()}`;
    const grossAmount = Number(plan.price);

    const snapTransaction = await createSnapTransaction({
      orderId,
      grossAmount,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.profile?.phone ?? undefined,
      itemName: `Paket ${plan.name} - ${company.name}`,
    });

    const invoice = await billingRepository.createInvoice({
      companyUuid: company.uuid,
      planUuid: plan.uuid,
      provider: "midtrans",
      providerInvoiceId: orderId,
      amount: grossAmount,
      paymentLink: snapTransaction.redirect_url,
      expiredAt: null,
    });

    return formatInvoice(invoice);
  },
};
