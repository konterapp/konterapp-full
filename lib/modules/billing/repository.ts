import { Prisma } from "@prisma/client";
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

  async findInvoiceByCompanyAndUuid(companyUuid: string, invoiceUuid: string) {
    return prisma.subscriptionInvoice.findFirst({
      where: { companyUuid, uuid: invoiceUuid },
      include: { plan: true },
    });
  },

  async markInvoiceExpired(invoiceUuid: string) {
    return prisma.subscriptionInvoice.update({
      where: { uuid: invoiceUuid },
      data: { status: "expired" },
      include: { plan: true },
    });
  },

  async createInvoice(data: {
    companyUuid: string;
    planUuid: string;
    provider: string;
    providerInvoiceId: string;
    amount: number;
    couponCode?: string | null;
    discountAmount?: number | null;
    paymentLink?: string | null;
    expiredAt?: Date | null;
  }) {
    return prisma.subscriptionInvoice.create({ data, include: { plan: true } });
  },

  async listInvoices(params: {
    where: Prisma.SubscriptionInvoiceWhereInput;
    orderBy: Prisma.SubscriptionInvoiceOrderByWithRelationInput;
    skip: number;
    take: number;
  }) {
    const { where, orderBy, skip, take } = params;
    return prisma.subscriptionInvoice.findMany({
      where,
      include: { company: true, plan: true },
      orderBy,
      skip,
      take,
    });
  },

  async countInvoices(where: Prisma.SubscriptionInvoiceWhereInput) {
    return prisma.subscriptionInvoice.count({ where });
  },

  async findInvoiceByUuid(uuid: string) {
    return prisma.subscriptionInvoice.findUnique({
      where: { uuid },
      include: { company: true, plan: true },
    });
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
