import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { loginSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserRoles, getUserPermissions } from "@/lib/permissions";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { resolveUserActiveCompany } from "@/lib/company-access";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_SECURE } from "@/lib/auth-cookie";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation
    const result = validateSchema(loginSchema, body);
    if (!("data" in result)) return result;
    const { email, password } = result.data;

    // Find user
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return errorResponse("Email atau password salah", 401);
    }

    if (!user.emailVerifiedAt) {
      return errorResponse("Email belum diverifikasi", 403, {
        error_code: ["EMAIL_NOT_VERIFIED"],
      });
    }

    if (!user.isActive) {
      return errorResponse("Akun Anda tidak aktif", 403);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse("Email atau password salah", 401);
    }

    let companyContext;
    try {
      companyContext = await resolveUserActiveCompany(user.id);
    } catch (error) {
      return errorResponse((error as Error).message || "Akun belum memiliki perusahaan aktif", 403);
    }

    const roles = await getUserRoles(user.id, companyContext.activeCompanyUuid);
    const permissions = await getUserPermissions(user.id, companyContext.activeCompanyUuid);
    const companies = companyContext.companies;

    // Create session token manually
    const isSecure = SESSION_COOKIE_SECURE;
    const cookieName = SESSION_COOKIE_NAME;
    const token = await encode({
      token: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        roles,
        permissions,
        activeCompanyUuid: companyContext.activeCompanyUuid,
        companies,
      },
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return successResponse("Login berhasil", {
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        roles,
        permissions,
        active_company_uuid: companyContext.activeCompanyUuid,
        companies,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Terjadi kesalahan saat login", 500);
  }
}
