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
  impersonatedByAdministratorId?: string;
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
    // Token sesi masih valid tapi akunnya sudah dihapus/tidak ada -- perlakukan
    // sebagai sesi tidak valid (401) supaya interceptor axios di lib/api/api.ts
    // auto-redirect ke /login, bukan cuma tampil shell "Guest User" kosong.
    // Sekalian hapus cookie sesi supaya request berikutnya tidak lolos lagi.
    const response = errorResponse("Sesi tidak valid, silakan login kembali", 401);
    response.cookies.delete(cookieName);
    return response;
  }

  const tokenData = token as AuthTokenShape;
  const preferredCompanyUuid = req.headers.get("x-company-uuid") || tokenData.activeCompanyUuid || null;
  let companyContext;
  try {
    companyContext = await resolveUserActiveCompany(user.id, preferredCompanyUuid);
  } catch (error) {
    return errorResponse((error as Error).message || "Akun belum memiliki perusahaan aktif", 403);
  }

  const roles = await getUserRoles(user.id, companyContext.activeCompanyUuid);
  const permissions = await getUserPermissions(user.id, companyContext.activeCompanyUuid);
  const companies = companyContext.companies;

  const subscription = await billingRepository.findSubscriptionByCompanyUuid(companyContext.activeCompanyUuid);

  // Check if impersonating -- baik oleh sesama tenant administrator (impersonatorId,
  // User.id lain di company yang sama) maupun oleh SaaS administrator dari panel
  // /administrator (impersonatedByAdministratorId, Administrator.id).
  const impersonatorId = tokenData.impersonatorId ?? null;
  const impersonatedByAdministratorId = tokenData.impersonatedByAdministratorId ?? null;

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
    impersonating: !!impersonatorId || !!impersonatedByAdministratorId,
    impersonated_by_administrator: !!impersonatedByAdministratorId,
  });
}
