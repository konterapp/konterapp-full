import { createHash, randomBytes } from "crypto";
import { v7 as uuidv7 } from "uuid";
import { hash } from "bcryptjs";
import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const TOKEN_TTL_HOURS = 1;
const RESEND_THROTTLE_SECONDS = 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildResetEmail(params: { name: string; token: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
  const url = `${baseUrl}/reset-password?token=${params.token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #142D52; margin-bottom: 8px;">Atur Ulang Password Anda</h2>
      <p style="margin: 0 0 16px;">Halo <strong>${params.name}</strong>,</p>
      <p style="margin: 0 0 24px; line-height: 1.6;">
        Kami menerima permintaan untuk mengatur ulang password KonterApp Anda.
        Klik tombol di bawah untuk membuat password baru. Link berlaku
        ${TOKEN_TTL_HOURS} jam.
      </p>
      <a href="${url}" style="display: inline-block; background: #142D52; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
        Atur Ulang Password
      </a>
      <p style="margin: 24px 0 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
        Kalau tombol tidak berfungsi, salin link berikut ke browser:<br>
        <a href="${url}" style="color: #142D52; word-break: break-all;">${url}</a>
        <br><br>
        Abaikan email ini kalau Anda tidak meminta atur ulang password.
      </p>
    </div>
  `;

  const text = `Halo ${params.name},\n\nAtur ulang password KonterApp Anda lewat link berikut (berlaku ${TOKEN_TTL_HOURS} jam):\n${url}\n\nAbaikan kalau Anda tidak memintanya.`;

  return { html, text, url };
}

export const passwordResetService = {
  /**
   * Kirim email atur ulang password. Error jelas kalau email tidak terdaftar
   * atau akun nonaktif. Token lama user dihapus.
   */
  async requestReset(email: string) {
    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (!user) {
      throw new ApiError("Email tidak terdaftar", 404);
    }
    if (!user.isActive) {
      throw new ApiError("Akun tidak aktif", 400);
    }

    const lastToken = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (
      lastToken &&
      Date.now() - lastToken.createdAt.getTime() < RESEND_THROTTLE_SECONDS * 1000
    ) {
      throw new ApiError(
        `Tunggu ${RESEND_THROTTLE_SECONDS} detik sebelum mengirim ulang email`,
        429
      );
    }

    const token = randomBytes(32).toString("hex");
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: {
          uuid: uuidv7(),
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000),
        },
      }),
    ]);

    const { html, text } = buildResetEmail({ name: user.name, token });
    await sendMail({
      to: user.email,
      subject: "Atur Ulang Password KonterApp",
      html,
      text,
    });

    return { sent: true };
  },

  /** Set password baru dengan token dari email; token langsung dipakai (hapus). */
  async resetPassword(token: string, newPassword: string) {
    if (!token) {
      throw new ValidationApiError({ token: ["Token atur ulang tidak valid"] });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, isActive: true, deletedAt: true } } },
    });

    if (!record || record.usedAt) {
      throw new ApiError("Token atur ulang tidak dikenali atau sudah dipakai", 400);
    }
    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } });
      throw new ApiError("Token atur ulang sudah kedaluwarsa, silakan minta ulang", 400);
    }
    if (!record.user.isActive || record.user.deletedAt) {
      throw new ApiError("Akun tidak aktif", 400);
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { reset: true };
  },
};
