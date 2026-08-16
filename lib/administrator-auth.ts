import { SignJWT, jwtVerify } from "jose";

export const ADMINISTRATOR_COOKIE_NAME = "administrator_session";
export const ADMINISTRATOR_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export interface AdministratorSessionPayload {
  id: number;
  uuid: string;
  name: string;
  email: string;
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdministratorSession(payload: AdministratorSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMINISTRATOR_COOKIE_MAX_AGE}s`)
    .sign(getSecretKey());
}

export async function verifyAdministratorSession(token: string): Promise<AdministratorSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.id !== "number" || typeof payload.email !== "string") {
      return null;
    }
    return payload as unknown as AdministratorSessionPayload;
  } catch {
    return null;
  }
}
