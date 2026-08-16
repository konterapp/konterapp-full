import type { SubscriptionInvoice, Plan } from "@prisma/client";
import { INVOICE_PAYMENT_EXPIRY_HOURS } from "./constants";

type InvoiceWithPlan = SubscriptionInvoice & { plan: Plan };

export function formatPlan(plan: any) {
  return {
    uuid: plan.uuid,
    code: plan.code,
    name: plan.name,
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
  const isExpired = new Date(subscription.expiresAt) < now;

  return {
    plan: formatPlan(subscription.plan),
    status: isExpired ? "expired" : subscription.status,
    started_at: subscription.startedAt,
    expires_at: subscription.expiresAt,
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
  };
}
