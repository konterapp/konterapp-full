import { NextRequest } from "next/server";
import { auth } from "./auth-config";
import { errorResponse } from "./response";
import { getUserPermissions, hasPermission } from "./permissions";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>>; userId: number }
) => Promise<Response>;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthenticated", 401);
    }
    return handler(req, { ...context, userId: Number(session.user.id) });
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
