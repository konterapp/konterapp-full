import { ApiError } from "@/lib/api-errors";
import { billingRepository } from "./repository";
import { prisma } from "@/lib/prisma";
import type { Plan, PlanTier } from "@prisma/client";

export interface PlanLimits {
  plan: (Plan & { tier: PlanTier }) | null;
  tier: PlanTier | null;
  maxBranches: number | null;
  maxUsers: number | null;
  maxProducts: number | null;
  maxTransactionsPerMonth: number | null;
}

/**
 * Baca batasan paket (tier) dari langganan aktif sebuah perusahaan.
 * Nilai null berarti tidak terbatas (unlimited).
 */
export async function getPlanLimits(companyUuid: string): Promise<PlanLimits> {
  const subscription = await billingRepository.findSubscriptionByCompanyUuid(companyUuid);
  const plan = subscription?.plan ?? null;
  const tier = plan?.tier ?? null;

  return {
    plan,
    tier,
    maxBranches: tier?.maxBranches ?? null,
    maxUsers: tier?.maxUsers ?? null,
    maxProducts: tier?.maxProducts ?? null,
    maxTransactionsPerMonth: tier?.maxTransactionsPerMonth ?? null,
  };
}

/**
 * Tolak pembuatan cabang jika jumlah cabang sudah mencapai batas paket.
 */
export async function assertBranchLimit(companyUuid: string, currentBranchCount: number) {
  const { tier, maxBranches } = await getPlanLimits(companyUuid);
  if (maxBranches == null) return;

  if (currentBranchCount >= maxBranches) {
    throw new ApiError(
      `Batas jumlah cabang untuk paket ${tier?.name ?? "Anda"} sudah tercapai (maksimal ${maxBranches} cabang). Upgrade paket untuk menambah cabang.`,
      400,
      undefined,
      "plan_limit_reached"
    );
  }
}

/**
 * Tolak pembuatan produk jika jumlah produk sudah mencapai batas paket.
 * Wajib dipanggil dalam tenant request context (companyUuid auto-disuntik
 * oleh prisma proxy saat menghitung appPosProduct).
 */
export async function assertProductLimit(companyUuid: string) {
  const { tier, maxProducts } = await getPlanLimits(companyUuid);
  if (maxProducts == null) return;

  const count = await prisma.appPosProduct.count({});
  if (count >= maxProducts) {
    throw new ApiError(
      `Batas jumlah produk untuk paket ${tier?.name ?? "Anda"} sudah tercapai (maksimal ${maxProducts} produk). Upgrade paket untuk menambah produk.`,
      400,
      undefined,
      "plan_limit_reached"
    );
  }
}

/**
 * Tolak transaksi kasir (POS sale) baru jika transaksi bulan berjalan sudah
 * mencapai batas paket. Hanya menghitung AppPosSale (penjualan kasir); PPOB
 * tidak dihitung karena dibuat via provider eksternal.
 */
export async function assertTransactionLimit(companyUuid: string) {
  const { tier, maxTransactionsPerMonth } = await getPlanLimits(companyUuid);
  if (maxTransactionsPerMonth == null) return;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const count = await prisma.appPosSale.count({
    where: { saleDate: { gte: startOfMonth, lt: startOfNextMonth } },
  });
  if (count >= maxTransactionsPerMonth) {
    throw new ApiError(
      `Batas transaksi bulan ini untuk paket ${tier?.name ?? "Anda"} sudah tercapai (maksimal ${maxTransactionsPerMonth} transaksi/bulan). Upgrade paket untuk transaksi tanpa batas.`,
      400,
      undefined,
      "plan_limit_reached"
    );
  }
}
