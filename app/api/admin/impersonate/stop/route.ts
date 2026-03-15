import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { getUserRoles, getUserPermissions } from "@/lib/permissions";
import { encode, decode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("authjs.session-token")?.value;

    if (!sessionToken) {
      return errorResponse("Unauthenticated", 401);
    }

    // Decode current token to get impersonatorId
    const decoded = await decode({
      token: sessionToken,
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    });

    if (!decoded?.impersonatorId) {
      return errorResponse("Anda tidak sedang dalam mode impersonate", 400);
    }

    const adminId = Number(decoded.impersonatorId);

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { id: adminId, deletedAt: null },
    });

    if (!adminUser) {
      return errorResponse("Admin user tidak ditemukan", 404);
    }

    const roles = await getUserRoles(adminUser.id);
    const permissions = await getUserPermissions(adminUser.id);

    // Create new session as original admin (no impersonatorId)
    const token = await encode({
      token: {
        id: String(adminUser.id),
        name: adminUser.name,
        email: adminUser.email,
        roles,
        permissions,
      },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    });

    const isSecure = process.env.NODE_ENV === "production";
    cookieStore.set("authjs.session-token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return successResponse("Berhasil kembali ke admin", {
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        roles,
        permissions,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
}
