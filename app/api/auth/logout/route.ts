import { successResponse } from "@/lib/response";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("authjs.session-token");
  return successResponse("Logout berhasil");
}
