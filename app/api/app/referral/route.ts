import { successResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { referralService } from "@/lib/modules/referral/referral.service";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(
  withApiErrorHandling(async (_req, context) => {
    // Pastikan user punya kode referral.
    const referralCode = await referralService.ensureReferralCode(context.userId);

    const [user, totalReferrals, paidReferrals, totalCommissionAgg, commissions, referrals] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: context.userId },
          select: { referralBalance: true, name: true },
        }),
        prisma.referralCommission.count({ where: { referrerUserId: context.userId } }),
        prisma.referralCommission.count({
          where: { referrerUserId: context.userId, status: "paid" },
        }),
        prisma.referralCommission.aggregate({
          where: { referrerUserId: context.userId, status: "paid" },
          _sum: { amount: true },
        }),
        prisma.referralCommission.findMany({
          where: { referrerUserId: context.userId },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.user.findMany({
          where: { referredByUserId: context.userId },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            emailVerifiedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    const referredUsers = await prisma.user.findMany({
      where: { id: { in: commissions.map((c) => c.referredUserId) } },
      select: { id: true, name: true, email: true },
    });
    const referredMap = new Map(referredUsers.map((u) => [u.id, u]));

    return successResponse("Data referral berhasil dimuat", {
      referral_code: referralCode,
      referral_balance: user ? Number(user.referralBalance) : 0,
      name: user?.name ?? null,
      stats: {
        total_referrals: totalReferrals,
        paid_referrals: paidReferrals,
        total_commission: totalCommissionAgg._sum.amount
          ? Number(totalCommissionAgg._sum.amount)
          : 0,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        verified: Boolean(r.emailVerifiedAt),
        joined_at: r.createdAt,
      })),
      commissions: commissions.map((c) => {
        const referred = referredMap.get(c.referredUserId);
        return {
          uuid: c.uuid,
          amount: Number(c.amount),
          base_amount: Number(c.baseAmount),
          plan_code: c.planCode,
          status: c.status,
          created_at: c.createdAt,
          referred: { name: referred?.name ?? "—", email: referred?.email ?? "—" },
        };
      }),
    });
  })
);