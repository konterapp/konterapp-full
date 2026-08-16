import { prisma } from "@/lib/prisma";
import { getUserRoles, getUserPermissions } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { resolveUserActiveCompany } from "@/lib/company-access";
import { billingRepository } from "@/lib/modules/billing/repository";
import { formatSubscription } from "@/lib/modules/billing/billing.mapper";

type AuthTokenShape = {
  id?: string;
  activeCompanyUuid?: string;
  impersonatorId?: string;
};

export async function GET(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const token = await getToken({ req, secret: process.env.AUTH_SECRET, salt: cookieName, cookieName });
  if (!token?.id) {
    return errorResponse("Unauthenticated", 401);
  }

  const user = await prisma.user.findFirst({
    where: { id: Number(token.id), deletedAt: null },
  });

  if (!user) {
    return errorResponse("User tidak ditemukan", 404);
  }

  const roles = await getUserRoles(user.id);
  const permissions = await getUserPermissions(user.id);
  const tokenData = token as AuthTokenShape;
  const preferredCompanyUuid = req.headers.get("x-company-uuid") || tokenData.activeCompanyUuid || null;
  let companyContext;
  try {
    companyContext = await resolveUserActiveCompany(user.id, preferredCompanyUuid);
  } catch (error) {
    return errorResponse((error as Error).message || "Akun belum memiliki perusahaan aktif", 403);
  }
  const companies = companyContext.companies;

  const subscription = await billingRepository.findSubscriptionByCompanyUuid(companyContext.activeCompanyUuid);

  // Check if impersonating
  const impersonatorId = tokenData.impersonatorId ?? null;

  return successResponse("User data", {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    roles,
    permissions,
    active_company_uuid: companyContext.activeCompanyUuid,
    companies,
    subscription: formatSubscription(subscription),
    impersonating: !!impersonatorId,
  });
}
