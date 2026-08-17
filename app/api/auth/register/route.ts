import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-errors";
import { errorResponse, successResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { registerSchema } from "@/lib/validations/auth";
import { provisionTenantUser } from "@/lib/modules/auth/provisioning";
import { emailVerificationService } from "@/lib/modules/auth/verification";
import { referralService } from "@/lib/modules/referral/referral.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = validateSchema(registerSchema, body);
    if (!("data" in result)) return result;

    const { name, email, password, company_name, referral_code } = result.data;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const companyName = company_name?.trim() || `Konter ${normalizedName}`;

    // Validasi kode referral (jangan bocorkan email calon user ke error).
    let referredByUserId: number | undefined;
    if (referral_code) {
      try {
        const referrer = await referralService.validateCode(referral_code);
        referredByUserId = referrer.id;
      } catch (error) {
        if (error instanceof ApiError) {
          return errorResponse(error.message, 400, {
            referral_code: [error.message],
          });
        }
        throw error;
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true },
    });
    if (existingUser) {
      return errorResponse("Email sudah terdaftar", 409, {
        email: ["Email sudah terdaftar"],
      });
    }

    const hashedPassword = await hash(password, 10);

    // Registrasi = membuat tenant (company) baru milik user tersebut,
    // lengkap dengan role default, paket Free gratis selamanya, dan user
    // sebagai administrator tenant.
    const { user } = await provisionTenantUser({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      companyName,
      referredByUserId,
    });

    // Kirim email verifikasi (di dev tanpa SMTP, link dilog ke console).
    // Gagal kirim tidak membatalkan registrasi -- user bisa minta kirim ulang
    // dari halaman login.
    try {
      await emailVerificationService.sendForUser(user.id);
    } catch (error) {
      console.error("Gagal kirim email verifikasi:", error);
    }

    return successResponse(
      `Registrasi berhasil. Email verifikasi telah dikirim ke ${normalizedEmail}, silakan verifikasi sebelum login.`,
      { user },
      201
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta as { target?: string[] | string } | undefined)?.target;
      const targetLabel = Array.isArray(target) ? target.join(",") : String(target ?? "");
      if (targetLabel.includes("email")) {
        return errorResponse("Email sudah terdaftar", 409, {
          email: ["Email sudah terdaftar"],
        });
      }
      return errorResponse("Terjadi konflik data, silakan coba lagi", 409);
    }

    console.error("Register error:", error);
    return errorResponse("Terjadi kesalahan saat registrasi", 500);
  }
}
