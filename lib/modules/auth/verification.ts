import { createHash, randomBytes } from "crypto";
import { v7 as uuidv7 } from "uuid";
import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const TOKEN_TTL_HOURS = 24;
const RESEND_THROTTLE_SECONDS = 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildVerificationEmail(params: { name: string; token: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
  const url = `${baseUrl}/verify-email?token=${params.token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #142D52; margin-bottom: 8px;">Verifikasi Email Anda</h2>
      <p style="margin: 0 0 16px;">Halo <strong>${params.name}</strong>,</p>
      <p style="margin: 0 0 24px; line-height: 1.6;">
        Terima kasih sudah mendaftar di KonterApp. Klik tombol di bawah untuk
        memverifikasi email Anda. Link berlaku ${TOKEN_TTL_HOURS} jam.
      </p>
      <a href="${url}" style="display: inline-block; background: #142D52; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
        Verifikasi Email
      </a>
      <p style="margin: 24px 0 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
        Kalau tombol tidak berfungsi, salin link berikut ke browser:<br>
        <a href="${url}" style="color: #142D52; word-break: break-all;">${url}</a>
        <br><br>
        Abaikan email ini kalau Anda tidak merasa mendaftar.
      </p>
    </div>
  `;

  const text = `Halo ${params.name},\n\nVerifikasi email KonterApp Anda lewat link berikut (berlaku ${TOKEN_TTL_HOURS} jam):\n${url}\n\nAbaikan kalau Anda tidak merasa mendaftar.`;

  return { html, text, url };
}

async function issueVerificationToken(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  // Token di database disimpan sebagai hash -- kebocoran DB tidak langsung
  // membuka akses verifikasi.
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: {
        uuid: uuidv7(),
        userId,
        tokenHash: hashToken(token),
        expiresAt,
      },
    }),
  ]);

  return token;
}

async function deliverVerificationEmail(user: { id: number; name: string; email: string }) {
  const token = await issueVerificationToken(user.id);

  const { html, text } = buildVerificationEmail({ name: user.name, token });
  await sendMail({
    to: user.email,
    subject: "Verifikasi Email KonterApp",
    html,
    text,
  });
}

export const emailVerificationService = {
  /**
   * Kirim email verifikasi untuk user (register, user buatan admin/app).
   * Token lama user dihapus supaya hanya satu yang aktif.
   */
  async sendForUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, emailVerifiedAt: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new ApiError("User tidak ditemukan", 404);
    }
    if (user.emailVerifiedAt) {
      throw new ApiError("Email sudah terverifikasi", 409);
    }

    const lastToken = await prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (
      lastToken &&
      Date.now() - lastToken.createdAt.getTime() < RESEND_THROTTLE_SECONDS * 1000
    ) {
      throw new ApiError(
        `Tunggu ${RESEND_THROTTLE_SECONDS} detik sebelum kirim ulang email verifikasi`,
        429
      );
    }

    await deliverVerificationEmail(user);
  },

  /** Verifikasi token dari link email; tandai email user terverifikasi. */
  async verifyToken(token: string) {
    if (!token) {
      throw new ValidationApiError({ token: ["Token verifikasi tidak valid"] });
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { id: true, emailVerifiedAt: true } } },
    });

    if (!record) {
      throw new ApiError("Token verifikasi tidak dikenali atau sudah dipakai", 400);
    }
    if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      throw new ApiError("Token verifikasi sudah kedaluwarsa, silakan minta kirim ulang", 400);
    }
    if (record.user.emailVerifiedAt) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      return { email_verified: true };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);

    return { email_verified: true };
  },

  /**
   * Kirim ulang email verifikasi berdasarkan email (dari halaman login).
   * Selalu sukses tanpa membocorkan apakah email terdaftar.
   */
  async resendByEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
      select: { id: true, emailVerifiedAt: true },
    });

    if (!user || user.emailVerifiedAt) {
      return { sent: true };
    }

    try {
      await this.sendForUser(user.id);
    } catch (error) {
      // Throttle tetap dilaporkan supaya user tahu harus tunggu,
      // error lain diabaikan (response tetap generik).
      if (error instanceof ApiError && error.statusCode === 429) {
        throw error;
      }
    }

    return { sent: true };
  },
};
