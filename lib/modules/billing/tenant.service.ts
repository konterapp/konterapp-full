import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { formatSubscription, formatInvoice } from "./billing.mapper";
import { createMayarInvoice } from "./mayar-client";
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

    const mayarInvoice = await createMayarInvoice({
      name: user.name,
      email: user.email,
      mobile: user.profile?.phone || "081234567890",
      description: `Upgrade paket ${plan.name} - ${company.name}`,
      items: [
        {
          quantity: 1,
          rate: Number(plan.price),
          description: `Paket ${plan.name} (${company.name})`,
        },
      ],
      extraData: {
        companyUuid: company.uuid,
        planUuid: plan.uuid,
      },
    });

    const invoice = await billingRepository.createInvoice({
      companyUuid: company.uuid,
      planUuid: plan.uuid,
      providerInvoiceId: mayarInvoice.id,
      amount: Number(plan.price),
      paymentLink: mayarInvoice.link,
      expiredAt: mayarInvoice.expiredAt ? new Date(mayarInvoice.expiredAt) : null,
    });

    return formatInvoice(invoice);
  },
};
