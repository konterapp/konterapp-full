import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { validateSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";

const claimSchema = z.object({
  code: z.string().trim().min(1, "Kode referral wajib diisi").max(20),
});

export const POST = withAuth(
  withApiErrorHandling(async (req, context) => {
    const body = await req.json().catch(() => ({}));
    const result = validateSchema(claimSchema, body);
    if (!("data" in result)) return result;

    const code = result.data.code.toUpperCase();

    // Cek user sudah punya referrer belum
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { referredByUserId: true },
    });
    if (!user) return errorResponse("User tidak ditemukan", 404);
    if (user.referredByUserId) {
      return successResponse("Referral sudah tercatat", { claimed: false });
    }

    // Cari referrer
    const referrer = await prisma.user.findFirst({
      where: { referralCode: code, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!referrer) return errorResponse("Kode referral tidak valid", 404);
    if (referrer.id === context.userId) {
      return errorResponse("Tidak bisa menggunakan kode referral sendiri", 400);
    }

    // Set referral
    await prisma.user.update({
      where: { id: context.userId },
      data: { referredByUserId: referrer.id },
    });

    return successResponse("Referral berhasil diklaim", { claimed: true });
  })
);
