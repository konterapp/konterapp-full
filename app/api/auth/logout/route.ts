import { successResponse } from "@/lib/response";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookie";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return successResponse("Logout berhasil");
}
