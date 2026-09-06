import { Prisma } from "@prisma/client";
import { prisma, type TransactionClient } from "@/lib/prisma";

type Client = TransactionClient | typeof prisma;

export const billingRepository = {
  async findTierByCode(code: string) {
    return prisma.planTier.findUnique({ where: { code } });
  },

  async listTiers() {
    return prisma.planTier.findMany({
      orderBy: { displayOrder: "asc" },
    });
  },

  async listPlansWithTiers() {
    return prisma.plan.findMany({
      where: { isActive: true },
      include: { tier: true },
      orderBy: { displayOrder: "asc" },
    });
  },

  async findPlanByCode(code: string) {
    return prisma.plan.findUnique({ where: { code }, include: { tier: true } });
  },

  async findPlanByUuid(uuid: string) {
    return prisma.plan.findUnique({ where: { uuid }, include: { tier: true } });
  },

  async findSubscriptionByCompanyUuid(companyUuid: string) {
    return prisma.companySubscription.findUnique({
      where: { companyUuid },
      include: { plan: { include: { tier: true } } },
    });
  },

  async createSubscription(data: {
    companyUuid: string;
    planUuid: string;
    status: string;
    startedAt: Date;
    expiresAt: Date | null;
  }) {
    return prisma.companySubscription.create({ data, include: { plan: { include: { tier: true } } } });
  },

  async updateSubscription(
    companyUuid: string,
    data: { planUuid?: string; status?: string; startedAt?: Date; expiresAt?: Date | null }
  ) {
    return prisma.companySubscription.update({
      where: { companyUuid },
      data,
      include: { plan: { include: { tier: true } } },
    });
  },

  async listInvoicesByCompanyUuid(companyUuid: string) {
    return prisma.subscriptionInvoice.findMany({
      where: { companyUuid },
      include: { plan: { include: { tier: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async findInvoiceByCompanyAndUuid(companyUuid: string, invoiceUuid: string) {
    return prisma.subscriptionInvoice.findFirst({
      where: { companyUuid, uuid: invoiceUuid },
      include: { plan: { include: { tier: true } } },
    });
  },

  async markInvoiceExpired(invoiceUuid: string) {
    return prisma.subscriptionInvoice.update({
      where: { uuid: invoiceUuid },
      data: { status: "expired" },
      include: { plan: { include: { tier: true } } },
    });
  },

  async createInvoice(
    tx: Client,
    data: {
      companyUuid: string;
      planUuid: string;
      provider: string;
      providerInvoiceId: string;
      amount: number;
      userId?: number | null;
      couponCode?: string | null;
      discountAmount?: number | null;
      referralCode?: string | null;
      referralDiscountAmount?: number | null;
      referralBalanceUsed?: number | null;
      paymentLink?: string | null;
      expiredAt?: Date | null;
    }
  ) {
    return tx.subscriptionInvoice.create({ data, include: { plan: { include: { tier: true } } } });
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
      include: { company: true, plan: true, administrator: true },
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
      include: { company: true, plan: true, administrator: true },
    });
  },

  async findInvoiceByProviderInvoiceId(providerInvoiceId: string) {
    return prisma.subscriptionInvoice.findUnique({
      where: { providerInvoiceId },
      include: { plan: { include: { tier: true } } },
    });
  },

  async markInvoicePaid(providerInvoiceId: string, paidAt: Date) {
    return prisma.subscriptionInvoice.update({
      where: { providerInvoiceId },
      data: { status: "paid", paidAt },
    });
  },

  runInTransaction<T>(cb: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(cb);
  },
};
