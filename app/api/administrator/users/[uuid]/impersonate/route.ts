import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { withAdministratorAuth } from "@/lib/administrator-api-middleware";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { getAdministratorSession } from "@/lib/administrator-session";
import { getUserRoles, getUserPermissions } from "@/lib/permissions";
import { resolveUserActiveCompany } from "@/lib/company-access";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_SECURE } from "@/lib/auth-cookie";

export const POST = withAdministratorAuth(
  withApiErrorHandling(async (_req, context) => {
    const session = await getAdministratorSession();
    if (!session) {
      return errorResponse("Unauthenticated", 401);
    }

    const params = await context.params;
    const targetUser = await prisma.user.findFirst({
      where: { uuid: params.uuid, deletedAt: null },
    });

    if (!targetUser) {
      return errorResponse("User tidak ditemukan", 404);
    }

    let companyContext;
    try {
      companyContext = await resolveUserActiveCompany(targetUser.id);
    } catch (error) {
      return errorResponse((error as Error).message || "User ini belum memiliki perusahaan aktif", 403);
    }

    const roles = await getUserRoles(targetUser.id, companyContext.activeCompanyUuid);
    const permissions = await getUserPermissions(targetUser.id, companyContext.activeCompanyUuid);
    const companies = companyContext.companies;

    // Beda dari impersonate tenant-admin-ke-tenant-user (impersonatorId,
    // menunjuk User.id lain): di sini yang login-as adalah SaaS Administrator,
    // bukan User, jadi dicatat di field terpisah supaya /api/app/impersonate/stop
    // (yang mengasumsikan impersonatorId = User.id) tidak keliru me-restore
    // sesi. Sesi administrator_session tetap utuh di cookie terpisah -- "stop"
    // di sini cukup hapus cookie tenant, tidak perlu restore apa pun.
    const token = await encode({
      token: {
        id: String(targetUser.id),
        name: targetUser.name,
        email: targetUser.email,
        roles,
        permissions,
        activeCompanyUuid: companyContext.activeCompanyUuid,
        companies,
        impersonatedByAdministratorId: String(session.id),
      },
      secret: process.env.AUTH_SECRET!,
      salt: SESSION_COOKIE_NAME,
    });

    const cookieStore = await cookies();
    const isSecure = SESSION_COOKIE_SECURE;
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return successResponse("Berhasil login sebagai user ini", {
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        roles,
        permissions,
        active_company_uuid: companyContext.activeCompanyUuid,
        companies,
      },
      impersonating: true,
    });
  })
);
