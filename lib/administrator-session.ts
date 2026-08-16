import { cookies } from "next/headers";
import {
  ADMINISTRATOR_COOKIE_MAX_AGE,
  ADMINISTRATOR_COOKIE_NAME,
  AdministratorSessionPayload,
  signAdministratorSession,
  verifyAdministratorSession,
} from "./administrator-auth";

export async function setAdministratorSessionCookie(payload: AdministratorSessionPayload) {
  const token = await signAdministratorSession(payload);
  const isSecure = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set(ADMINISTRATOR_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: ADMINISTRATOR_COOKIE_MAX_AGE,
  });
}

export async function clearAdministratorSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMINISTRATOR_COOKIE_NAME);
}

export async function getAdministratorSession(): Promise<AdministratorSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMINISTRATOR_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdministratorSession(token);
}
