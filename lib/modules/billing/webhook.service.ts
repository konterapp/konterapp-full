import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { getMayarInvoice } from "./mayar-client";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const billingWebhookService = {
  async handleMayarInvoicePaid(providerInvoiceId: string) {
    // Re-verify status directly against Mayar's API rather than trusting the
    // webhook payload alone, since Mayar does not document signature
    // verification for webhook requests.
    const remoteInvoice = await getMayarInvoice(providerInvoiceId);
    if (remoteInvoice.status !== "paid") {
      return { processed: false, reason: "Invoice belum berstatus paid di Mayar" };
    }

    const invoice = await billingRepository.findInvoiceByProviderInvoiceId(providerInvoiceId);
    if (!invoice) {
      throw new ApiError("Invoice tidak ditemukan", 404);
    }

    if (invoice.status === "paid") {
      return { processed: false, reason: "Invoice sudah diproses sebelumnya" };
    }

    const now = new Date();
    await billingRepository.markInvoicePaid(providerInvoiceId, now);

    const existingSubscription = await billingRepository.findSubscriptionByCompanyUuid(invoice.companyUuid);
    const plan = await billingRepository.findPlanByUuid(invoice.planUuid);
    if (!plan) {
      throw new ApiError("Paket tidak ditemukan", 404);
    }

    const baseDate = existingSubscription && existingSubscription.expiresAt > now ? existingSubscription.expiresAt : now;
    const expiresAt = addDays(baseDate, plan.durationDays);

    if (existingSubscription) {
      await billingRepository.updateSubscription(invoice.companyUuid, {
        planUuid: plan.uuid,
        status: "active",
        expiresAt,
      });
    } else {
      await billingRepository.createSubscription({
        companyUuid: invoice.companyUuid,
        planUuid: plan.uuid,
        status: "active",
        startedAt: now,
        expiresAt,
      });
    }

    return { processed: true };
  },
};
