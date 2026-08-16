import { successResponse } from "@/lib/response";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { clearAdministratorSessionCookie } from "@/lib/administrator-session";

export const POST = withApiErrorHandling(async () => {
  await clearAdministratorSessionCookie();
  return successResponse("Logout berhasil");
});
