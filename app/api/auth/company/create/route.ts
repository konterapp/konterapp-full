import { NextRequest } from "next/server";
import { withSession } from "@/lib/api-middleware";
import { errorResponse, successResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { createCompanySchema } from "@/lib/validations/auth";
import { provisionCompanyForUser } from "@/lib/modules/auth/provisioning";
import { getUserCompanyMemberships } from "@/lib/company-access";
import { getUserRoles, getUserPermissions } from "@/lib/permissions";
import { encode } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

export const POST = withSession(async (req: NextRequest, context) => {
  const body = await req.json().catch(() => null);
  if (!body) {
    return errorResponse("Payload tidak valid", 422);
  }

  const result = validateSchema(createCompanySchema, body);
  if (!("data" in result)) return result;

  const memberships = await getUserCompanyMemberships(context.userId);
  if (memberships.length > 0) {
    return errorResponse("Anda sudah terhubung ke perusahaan", 409);
  }

  const company = await provisionCompanyForUser({
    userId: context.userId,
    companyName: result.data.company_name,
  });

  const companies = await getUserCompanyMemberships(context.userId);
  const roles = await getUserRoles(context.userId, company.uuid);
  const permissions = await getUserPermissions(context.userId, company.uuid);

  // Refresh session token supaya membawa company context yang baru
  const isSecure = req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const currentToken = await getToken({ req, secret: process.env.AUTH_SECRET, salt: cookieName, cookieName });
  const token = await encode({
    token: {
      id: String(context.userId),
      name: currentToken?.name,
      email: currentToken?.email,
      roles,
      permissions,
      activeCompanyUuid: company.uuid,
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

  return successResponse(`Perusahaan ${company.name} berhasil dibuat`, {
    active_company_uuid: company.uuid,
    companies,
  });
});
