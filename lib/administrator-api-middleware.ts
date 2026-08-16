import { NextRequest } from "next/server";
import { errorResponse } from "./response";
import { getAdministratorSession } from "./administrator-session";

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response>;

export function withAdministratorAuth(handler: RouteHandler) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const session = await getAdministratorSession();
    if (!session) {
      return errorResponse("Unauthenticated", 401);
    }
    return handler(req, context);
  };
}
