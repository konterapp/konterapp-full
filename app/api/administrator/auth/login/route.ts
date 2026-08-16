import { NextRequest } from "next/server";
import { successResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { administratorLoginSchema } from "@/lib/validations/administrator";
import { withApiErrorHandling } from "@/lib/api-error-handler";
import { loginAdministrator } from "@/lib/modules/administrator/auth.service";
import { setAdministratorSessionCookie } from "@/lib/administrator-session";

export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = await req.json();

  const result = validateSchema(administratorLoginSchema, body);
  if (!("data" in result)) return result;
  const { email, password } = result.data;

  const administrator = await loginAdministrator(email, password);
  await setAdministratorSessionCookie(administrator);

  return successResponse("Login berhasil", { administrator });
});
