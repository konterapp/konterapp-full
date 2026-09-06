import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { referralService } from "@/lib/modules/referral/referral.service";
import type { SubscriptionInvoice } from "@prisma/client";

type SettleInvoicePayload = Pick<
  SubscriptionInvoice,
  "uuid" | "companyUuid" | "planUuid" | "amount" | "userId" | "referralBalanceUsed"
>;

interface SettleInvoiceOptions {
  paidByAdministratorId?: number | null;
  adminNote?: string | null;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Logic terpadu "tandai invoice lunas + aktifkan/perpanjang subscription +
 * komisi/saldo referral". Dipakai webhook Midtrans dan pelunasan manual admin
 * biar behavior-nya identik (tidak duplikat).
 *
 * Fungsi ini TIDAK mengecek status invoice (idempotency check) -- itu
 * tanggung jawab PEMANGGIL, karena pesan error-nya beda per pemanggil.
 */
export const billingSettlementService = {
  async settleInvoice(invoice: SettleInvoicePayload, options: SettleInvoiceOptions = {}) {
    const now = new Date();
    const existingSubscription = await billingRepository.findSubscriptionByCompanyUuid(invoice.companyUuid);
    const plan = await billingRepository.findPlanByUuid(invoice.planUuid);
    if (!plan) {
      throw new ApiError("Paket tidak ditemukan", 404);
    }

    const prevExpires = existingSubscription?.expiresAt ? new Date(existingSubscription.expiresAt) : null;
    const baseDate = prevExpires && prevExpires > now ? prevExpires : now;
    // Paket Free tak melewati pembayaran. durationDays null -> tanpa expiry.
    const expiresAt = plan.durationDays != null ? addDays(baseDate, plan.durationDays) : null;

    // Tandai invoice lunas & aktifkan subscription dalam satu transaction --
    // kalau salah satu gagal, invoice TIDAK boleh nyangkut "paid" tanpa
    // subscription aktif.
    await billingRepository.runInTransaction(async (tx) => {
      await tx.subscriptionInvoice.update({
        where: { uuid: invoice.uuid },
        data: {
          status: "paid",
          paidAt: now,
          paidByAdministratorId: options.paidByAdministratorId ?? null,
          adminNote: options.adminNote ?? null,
        },
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
  },
};