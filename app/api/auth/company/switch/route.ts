import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { errorResponse, successResponse } from "@/lib/response";
import { resolveUserActiveCompany } from "@/lib/company-access";
import { getUserPermissions, getUserRoles } from "@/lib/permissions";
import { encode } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_SECURE } from "@/lib/auth-cookie";

export const POST = withAuth(async (req: NextRequest, context) => {
  let body: { company_uuid?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Payload tidak valid", 422);
  }

  const companyUuid = body.company_uuid;
  if (!companyUuid) {
    return errorResponse("company_uuid wajib diisi", 422);
  }

  let companyContext;
  try {
    companyContext = await resolveUserActiveCompany(context.userId, companyUuid);
  } catch (error) {
    return errorResponse((error as Error).message || "Akses perusahaan tidak valid", 403);
  }

  if (companyContext.activeCompanyUuid !== companyUuid) {
    return errorResponse("Perusahaan tidak ditemukan dalam membership user", 403);
  }

  const roles = await getUserRoles(context.userId, companyContext.activeCompanyUuid);
  const permissions = await getUserPermissions(context.userId, companyContext.activeCompanyUuid);
  const companies = companyContext.companies;

  const isSecure = SESSION_COOKIE_SECURE;
  const cookieName = SESSION_COOKIE_NAME;
  const currentToken = await getToken({ req, secret: process.env.AUTH_SECRET, salt: cookieName, cookieName });
  const token = await encode({
    token: {
      id: String(context.userId),
      name: currentToken?.name,
      email: currentToken?.email,
      roles,
      permissions,
      activeCompanyUuid: companyContext.activeCompanyUuid,
      companies,
      impersonatorId: (currentToken as { impersonatorId?: string } | null)?.impersonatorId,
    },
    secret: process.env.AUTH_SECRET!,
    salt: cookieName,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return successResponse("Perusahaan aktif berhasil diganti", {
    active_company_uuid: companyContext.activeCompanyUuid,
    companies,
  });
});
