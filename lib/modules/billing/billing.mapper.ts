export function formatPlan(plan: any) {
  return {
    uuid: plan.uuid,
    code: plan.code,
    name: plan.name,
    price: Number(plan.price),
    duration_days: plan.durationDays,
  };
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
  return {
    uuid: invoice.uuid,
    plan: formatPlan(invoice.plan),
    amount: Number(invoice.amount),
    status: invoice.status,
    payment_link: invoice.paymentLink,
    paid_at: invoice.paidAt,
    expired_at: invoice.expiredAt,
    created_at: invoice.createdAt,
  };
}

export function formatAdminInvoice(invoice: any) {
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
    status: invoice.status,
    payment_link: invoice.paymentLink,
    paid_at: invoice.paidAt,
    expired_at: invoice.expiredAt,
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
  };
}
