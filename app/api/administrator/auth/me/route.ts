import { errorResponse, successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { getAdministratorSession } from "@/lib/administrator-session";
import { getAdministratorById } from "@/lib/modules/administrator/auth.service";

export const GET = withApiErrorHandling(async () => {
  const session = await getAdministratorSession();
  if (!session) {
    return errorResponse("Unauthenticated", 401);
  }

  const administrator = await getAdministratorById(session.id);
  if (!administrator) {
    return errorResponse("Unauthenticated", 401);
  }

  return successResponse("OK", { administrator });
});
