import { prisma } from "@/lib/prisma";
import { getUserRoles, getUserPermissions } from "@/lib/permissions";
import { successResponse, errorResponse } from "@/lib/response";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { resolveUserActiveCompany } from "@/lib/company-access";

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
    include: { profile: true },
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
    impersonating: !!impersonatorId,
    avatar_url: user.profile?.avatar ?? null,
    profile: user.profile
      ? {
          phone_without_dc: user.profile.phoneWithoutDc,
          dc: user.profile.dc,
          iso: user.profile.iso,
          address: user.profile.address,
          avatar: user.profile.avatar,
          title: user.profile.title,
          company: user.profile.company,
          work_unit: user.profile.workUnit,
          description: user.profile.description,
          company_logo: user.profile.companyLogo,
          country_id: user.profile.countryId,
          wilayah_kode: user.profile.wilayahKode,
          province_id: user.profile.provinceId,
          city_id: user.profile.cityId,
          admin_scope: user.profile.adminScope,
        }
      : null,
  });
}
