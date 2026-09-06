import type { SubscriptionInvoice, Plan } from "@prisma/client";
import { INVOICE_PAYMENT_EXPIRY_HOURS } from "./constants";

type InvoiceWithPlan = SubscriptionInvoice & { plan: Plan };

export function formatPlan(plan: any) {
  return {
    uuid: plan.uuid,
    code: plan.code,
    name: plan.name,
    tier_code: plan.tier?.code ?? null,
    tier_name: plan.tier?.name ?? null,
    billing_period: plan.billingPeriod ?? null,
    price: Number(plan.price),
    duration_days: plan.durationDays,
  };
}

function getInvoiceExpiry(invoice: InvoiceWithPlan) {
  if (invoice.expiredAt) return new Date(invoice.expiredAt);
  return new Date(new Date(invoice.createdAt).getTime() + INVOICE_PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);
}

export function isInvoiceExpired(invoice: InvoiceWithPlan) {
  if (invoice.status !== "pending") return false;
  return getInvoiceExpiry(invoice) < new Date();
}

export function formatSubscription(subscription: any | null) {
  if (!subscription) return null;

  const now = new Date();
  const expiresAt: Date | null = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
  const isExpired = expiresAt !== null && expiresAt < now;

  return {
    plan: formatPlan(subscription.plan),
    status: isExpired ? "expired" : subscription.status,
    started_at: subscription.startedAt,
    expires_at: expiresAt?.toISOString() ?? null,
  };
}

export function formatInvoice(invoice: any) {
  const expired = isInvoiceExpired(invoice);
  return {
    uuid: invoice.uuid,
    plan: formatPlan(invoice.plan),
    amount: Number(invoice.amount),
    coupon_code: invoice.couponCode,
    discount_amount: invoice.discountAmount != null ? Number(invoice.discountAmount) : null,
    referral_code: invoice.referralCode ?? null,
    referral_discount_amount: invoice.referralDiscountAmount != null ? Number(invoice.referralDiscountAmount) : null,
    referral_balance_used: invoice.referralBalanceUsed != null ? Number(invoice.referralBalanceUsed) : null,
    status: expired ? "expired" : invoice.status,
    payment_link: expired ? null : invoice.paymentLink,
    paid_at: invoice.paidAt,
    expired_at: invoice.expiredAt,
    created_at: invoice.createdAt,
  };
}

export function formatAdminInvoice(invoice: any) {
  const expired = isInvoiceExpired(invoice);
  return {
    uuid: invoice.uuid,
    provider: invoice.provider,
    provider_invoice_id: invoice.providerInvoiceId,
    provider_transaction_id: invoice.providerTransactionId,
    company: {
      uuid: invoice.company?.uuid,
      code: invoice.company?.code,
      name: invoice.company?.name,
    },
    plan: formatPlan(invoice.plan),
    amount: Number(invoice.amount),
    coupon_code: invoice.couponCode,
    discount_amount: invoice.discountAmount != null ? Number(invoice.discountAmount) : null,
    status: expired ? "expired" : invoice.status,
    payment_link: expired ? null : invoice.paymentLink,
    paid_at: invoice.paidAt,
    expired_at: invoice.expiredAt,
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
    paid_by_administrator_id: invoice.paidByAdministratorId ?? null,
    admin_note: invoice.adminNote ?? null,
    paid_by_administrator: invoice.administrator
      ? {
          id: invoice.administrator.id,
          name: invoice.administrator.name,
          email: invoice.administrator.email,
        }
      : null,
  };
}

interface CatalogTier {
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  maxBranches: number | null;
  maxUsers: number | null;
  maxProducts: number | null;
  maxTransactionsPerMonth: number | null;
  features: unknown;
  displayOrder: number;
}

interface CatalogPlan {
  uuid: string;
  code: string;
  name: string;
  billingPeriod: string | null;
  price: unknown;
  durationDays: number | null;
  tier?: CatalogTier | null;
  maxProducts?: number | null;
  maxTransactionsPerMonth?: number | null;
}

export function formatPlansCatalog(plans: CatalogPlan[]) {
  const tiersMap = new Map<string, Record<string, unknown>>();

  for (const plan of plans) {
    const tier = plan.tier;
    if (!tier) continue;

    let group = tiersMap.get(tier.uuid);
    if (!group) {
      group = {
        uuid: tier.uuid,
        code: tier.code,
        name: tier.name,
        description: tier.description,
        max_branches: tier.maxBranches,
        max_users: tier.maxUsers,
        max_products: tier.maxProducts,
        max_transactions_per_month: tier.maxTransactionsPerMonth,
        features: Array.isArray(tier.features) ? tier.features : [],
        display_order: tier.displayOrder,
        plans: [],
      };
      tiersMap.set(tier.uuid, group);
    }

    (group.plans as unknown[]).push({
      uuid: plan.uuid,
      code: plan.code,
      name: plan.name,
      billing_period: plan.billingPeriod,
      price: Number(plan.price),
      duration_days: plan.durationDays,
    });
  }

  return Array.from(tiersMap.values()).sort(
    (a, b) => (a.display_order as number) - (b.display_order as number)
  );
}
