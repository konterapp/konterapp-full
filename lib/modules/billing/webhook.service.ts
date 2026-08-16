import { createHash } from "crypto";
import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { getMidtransServerKey } from "./midtrans-client";

interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
  signature_key: string;
}

const SUCCESS_STATUSES = new Set(["settlement", "capture"]);

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const billingWebhookService = {
  verifySignature(payload: MidtransNotificationPayload): boolean {
    const serverKey = getMidtransServerKey();
    const expected = createHash("sha512")
      .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`)
      .digest("hex");
    return expected === payload.signature_key;
  },

  async handleNotification(payload: MidtransNotificationPayload) {
    if (!this.verifySignature(payload)) {
      throw new ApiError("Signature tidak valid", 401);
    }

    const isSuccess =
      SUCCESS_STATUSES.has(payload.transaction_status) &&
      (!payload.fraud_status || payload.fraud_status === "accept");

    if (!isSuccess) {
      return { processed: false, reason: `Status transaksi: ${payload.transaction_status}` };
    }

    // Selalu balas 200 walau invoice tidak ditemukan di sistem kita (mis. notifikasi
    // test dari dashboard Midtrans pakai order_id dummy) -- provider akan terus
    // retry / menganggap endpoint gagal kalau kita balas non-200 di sini.
    const invoice = await billingRepository.findInvoiceByProviderInvoiceId(payload.order_id);
    if (!invoice) {
      return { processed: false, reason: "Invoice tidak ditemukan di sistem kami" };
    }

    if (invoice.status === "paid") {
      return { processed: false, reason: "Invoice sudah diproses sebelumnya" };
    }

    const now = new Date();
    await billingRepository.markInvoicePaid(payload.order_id, now);

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
