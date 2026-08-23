import { NextRequest } from "next/server";
import { auth } from "./auth-config";
import { errorResponse } from "./response";
import { getUserPermissions, hasPermission } from "./permissions";
import { resolveUserActiveCompany } from "./company-access";
import { runWithTenantContext } from "./tenant-context";
import { billingRepository } from "@/lib/modules/billing/repository";
import { isSubscriptionActive } from "@/lib/modules/billing/subscription-status";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>>; userId: number; companyUuid: string }
) => Promise<Response>;

type SessionRouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>>; userId: number }
) => Promise<Response>;

/**
 * Wrapper auth tanpa company context -- untuk rute yang valid sebelum user
 * punya perusahaan (misal onboarding buat perusahaan pertama).
 */
export function withSession(handler: SessionRouteHandler) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthenticated", 401);
    }
    const userId = Number(session.user.id);
    return handler(req, { ...context, userId });
  };
}

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
    // Gate akses tenant: semua rute operasional /api/app/* (pos, dll) lewat
    // wrapper ini, jadi subscription yang expired/nonaktif diblokir di sini.
    // Rute billing & impersonate pakai withAuth langsung dan tetap terbuka
    // supaya user masih bisa perpanjang langganan dan admin bisa impersonate.
    const subscription = await billingRepository.findSubscriptionByCompanyUuid(context.companyUuid);
    if (!isSubscriptionActive(subscription)) {
      return errorResponse("Langganan perusahaan tidak aktif", 403);
    }

    const permissions = await getUserPermissions(context.userId, context.companyUuid);
    if (!hasPermission(permissions, permission)) {
      return errorResponse("Forbidden", 403);
    }
    return handler(req, context);
  });
}
