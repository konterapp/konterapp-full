import { createHash, randomBytes } from "crypto";
import { v7 as uuidv7 } from "uuid";
import { ApiError, ValidationApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";

const TOKEN_TTL_HOURS = 24 * 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildInvitationEmail(params: { name: string; companyName: string; token: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
  const url = `${baseUrl}/accept-invitation?token=${params.token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <h2 style="color: #142D52; margin-bottom: 8px;">Undangan Bergabung ke Perusahaan</h2>
      <p style="margin: 0 0 16px;">Halo <strong>${params.name}</strong>,</p>
      <p style="margin: 0 0 24px; line-height: 1.6;">
        Anda diundang untuk bergabung ke perusahaan <strong>${params.companyName}</strong> di
        KonterApp. Klik tombol di bawah untuk menerima undangan ini. Link berlaku
        ${TOKEN_TTL_HOURS / 24} hari.
      </p>
      <a href="${url}" style="display: inline-block; background: #142D52; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
        Terima Undangan
      </a>
      <p style="margin: 24px 0 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
        Kalau tombol tidak berfungsi, salin link berikut ke browser:<br>
        <a href="${url}" style="color: #142D52; word-break: break-all;">${url}</a>
        <br><br>
        Abaikan email ini kalau Anda tidak merasa diundang.
      </p>
    </div>
  `;

  const text = `Halo ${params.name},\n\nAnda diundang bergabung ke perusahaan ${params.companyName} di KonterApp. Terima undangan lewat link berikut (berlaku ${TOKEN_TTL_HOURS / 24} hari):\n${url}\n\nAbaikan kalau Anda tidak merasa diundang.`;

  return { html, text, url };
}

export const companyInvitationService = {
  /**
   * Kirim email undangan bergabung ke perusahaan untuk sebuah CompanyUser
   * yang baru dibuat (baik user baru maupun user existing yang digabung
   * ke company lain). Token lama untuk membership ini dihapus dulu.
   */
  async sendForMembership(companyUserUuid: string) {
    const companyUser = await prisma.companyUser.findUnique({
      where: { uuid: companyUserUuid },
      include: {
        user: { select: { id: true, name: true, email: true } },
        company: { select: { name: true } },
      },
    });

    if (!companyUser) {
      throw new ApiError("Membership perusahaan tidak ditemukan", 404);
    }
    if (companyUser.invitationAcceptedAt) {
      return;
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.companyInvitationToken.deleteMany({ where: { companyUserUuid } }),
      prisma.companyInvitationToken.create({
        data: {
          uuid: uuidv7(),
          companyUserUuid,
          tokenHash: hashToken(token),
          expiresAt,
        },
      }),
    ]);

    const { html, text } = buildInvitationEmail({
      name: companyUser.user.name,
      companyName: companyUser.company.name,
      token,
    });

    await sendMail({
      to: companyUser.user.email,
      subject: `Undangan Bergabung ke ${companyUser.company.name} - KonterApp`,
      html,
      text,
    });
  },

  /**
   * Terima undangan lewat token dari email. Menandai membership sebagai
   * diterima, dan sekalian memverifikasi email user kalau belum (klik
   * link ini membuktikan user menguasai inbox-nya).
   */
  async acceptToken(token: string) {
    if (!token) {
      throw new ValidationApiError({ token: ["Token undangan tidak valid"] });
    }

    const record = await prisma.companyInvitationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        companyUser: {
          include: {
            user: { select: { id: true, emailVerifiedAt: true } },
            company: { select: { name: true } },
          },
        },
      },
    });

    if (!record) {
      throw new ApiError("Token undangan tidak dikenali atau sudah dipakai", 400);
    }
    if (record.expiresAt < new Date()) {
      await prisma.companyInvitationToken.delete({ where: { id: record.id } });
      throw new ApiError("Token undangan sudah kedaluwarsa, silakan minta dikirim ulang", 400);
    }
    if (record.companyUser.invitationAcceptedAt) {
      await prisma.companyInvitationToken.delete({ where: { id: record.id } });
      return { company_name: record.companyUser.company.name, already_accepted: true };
    }

    await prisma.$transaction([
      prisma.companyUser.update({
        where: { uuid: record.companyUserUuid },
        data: { invitationAcceptedAt: new Date() },
      }),
      ...(record.companyUser.user.emailVerifiedAt
        ? []
        : [
            prisma.user.update({
              where: { id: record.companyUser.user.id },
              data: { emailVerifiedAt: new Date() },
            }),
          ]),
      prisma.companyInvitationToken.delete({ where: { id: record.id } }),
    ]);

    return { company_name: record.companyUser.company.name, already_accepted: false };
  },
};
