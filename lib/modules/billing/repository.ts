import { prisma } from "@/lib/prisma";

export const billingRepository = {
  async findPlanByCode(code: string) {
    return prisma.plan.findUnique({ where: { code } });
  },

  async findPlanByUuid(uuid: string) {
    return prisma.plan.findUnique({ where: { uuid } });
  },

  async findSubscriptionByCompanyUuid(companyUuid: string) {
    return prisma.companySubscription.findUnique({
      where: { companyUuid },
      include: { plan: true },
    });
  },

  async createSubscription(data: {
    companyUuid: string;
    planUuid: string;
    status: string;
    startedAt: Date;
    expiresAt: Date;
  }) {
    return prisma.companySubscription.create({ data, include: { plan: true } });
  },

  async updateSubscription(
    companyUuid: string,
    data: { planUuid?: string; status?: string; startedAt?: Date; expiresAt?: Date }
  ) {
    return prisma.companySubscription.update({
      where: { companyUuid },
      data,
      include: { plan: true },
    });
  },

  async listInvoicesByCompanyUuid(companyUuid: string) {
    return prisma.subscriptionInvoice.findMany({
      where: { companyUuid },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async createInvoice(data: {
    companyUuid: string;
    planUuid: string;
    providerInvoiceId: string;
    amount: number;
    paymentLink?: string | null;
    expiredAt?: Date | null;
  }) {
    return prisma.subscriptionInvoice.create({ data, include: { plan: true } });
  },

  async findInvoiceByProviderInvoiceId(providerInvoiceId: string) {
    return prisma.subscriptionInvoice.findUnique({
      where: { providerInvoiceId },
      include: { plan: true },
    });
  },

  async markInvoicePaid(providerInvoiceId: string, paidAt: Date) {
    return prisma.subscriptionInvoice.update({
      where: { providerInvoiceId },
      data: { status: "paid", paidAt },
    });
  },
};
