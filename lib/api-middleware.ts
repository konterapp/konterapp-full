import { NextRequest } from "next/server";
import { auth } from "./auth-config";
import { errorResponse } from "./response";
import { getUserPermissions, hasPermission } from "./permissions";
import { resolveUserActiveCompany } from "./company-access";
import { runWithTenantContext } from "./tenant-context";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>>; userId: number; companyUuid: string }
) => Promise<Response>;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthenticated", 401);
    }

    const userId = Number(session.user.id);
    const preferredCompanyUuid = req.headers.get("x-company-uuid") || session.user.activeCompanyUuid || null;

    let activeCompanyUuid: string;
    try {
      const companyContext = await resolveUserActiveCompany(userId, preferredCompanyUuid);
      activeCompanyUuid = companyContext.activeCompanyUuid;
    } catch (error) {
      return errorResponse((error as Error).message || "Akses perusahaan tidak valid", 403);
    }

    return runWithTenantContext(activeCompanyUuid, () =>
      handler(req, { ...context, userId, companyUuid: activeCompanyUuid })
    );
  };
}

export function withPermission(permission: string, handler: RouteHandler) {
  return withAuth(async (req, context) => {
    const permissions = await getUserPermissions(context.userId);
    if (!hasPermission(permissions, permission)) {
      return errorResponse("Forbidden", 403);
    }
    return handler(req, context);
  });
}
