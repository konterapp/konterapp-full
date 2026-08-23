import { createHash } from "crypto";
import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { getMidtransServerKey } from "./midtrans-client";
import { referralService } from "@/lib/modules/referral/referral.service";

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
    const existingSubscription = await billingRepository.findSubscriptionByCompanyUuid(invoice.companyUuid);
    const plan = await billingRepository.findPlanByUuid(invoice.planUuid);
    if (!plan) {
      throw new ApiError("Paket tidak ditemukan", 404);
    }

    const prevExpires = existingSubscription?.expiresAt ? new Date(existingSubscription.expiresAt) : null;
    const baseDate = prevExpires && prevExpires > now ? prevExpires : now;
    // Paket Free tak melewati webhook (tidak ada pembayaran). durationDays null -> tak cari harga baru.
    const expiresAt = plan.durationDays != null ? addDays(baseDate, plan.durationDays) : null;

    // Tandai invoice lunas & aktifkan subscription dalam satu transaction --
    // kalau salah satu gagal, invoice TIDAK boleh nyangkut "paid" tanpa
    // subscription aktif (retry webhook dari Midtrans jadi no-op karena guard
    // invoice.status === "paid" di atas, subscription tidak akan pernah aktif).
    await billingRepository.runInTransaction(async (tx) => {
      await tx.subscriptionInvoice.update({
        where: { providerInvoiceId: payload.order_id },
        data: { status: "paid", paidAt: now },
      });

      if (existingSubscription) {
        await tx.companySubscription.update({
          where: { companyUuid: invoice.companyUuid },
          data: { planUuid: plan.uuid, status: "active", expiresAt },
        });
      } else {
        await tx.companySubscription.create({
          data: {
            companyUuid: invoice.companyUuid,
            planUuid: plan.uuid,
            status: "active",
            startedAt: now,
            expiresAt,
          },
        });
      }
    });

    // Berikan komisi referral ke referrer (hanya pembayaran pertama, idempoten)
    // dan debit saldo referral yang dipakai di invoice ini.
    try {
      await referralService.grantCommissionForInvoice({
        uuid: invoice.uuid,
        companyUuid: invoice.companyUuid,
        amount: invoice.amount,
        planCode: plan.code,
      });
      await referralService.debitSaldoForInvoice({
        uuid: invoice.uuid,
        userId: invoice.userId,
        referralBalanceUsed: invoice.referralBalanceUsed,
        status: "paid",
      });
    } catch (error) {
      // Jangan gagalkan aktivasi langganan kalau komisi/saldo bermasalah.
      console.error("Gagal memproses komisi/saldo referral:", error);
    }

    return { processed: true };
  },
};
