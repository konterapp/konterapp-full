import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { withAuth } from "@/lib/api-middleware";
import { getUserRoles, getUserPermissions } from "@/lib/permissions";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

export const POST = withAuth(async (req, context) => {
  try {
    const params = await context.params;
    const targetId = Number(params.id);

    if (isNaN(targetId)) {
      return errorResponse("Invalid user ID", 400);
    }

    // Get current user's roles to check if admin
    const currentRoles = await getUserRoles(context.userId);
    if (!currentRoles.includes("admin")) {
      return errorResponse("Hanya admin yang bisa login sebagai user lain", 403);
    }

    // Cannot impersonate yourself
    if (targetId === context.userId) {
      return errorResponse("Tidak bisa login sebagai diri sendiri", 400);
    }

    // Find target user
    const targetUser = await prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
      include: { profile: true },
    });

    if (!targetUser) {
      return errorResponse("User tidak ditemukan", 404);
    }

    // Cannot impersonate another admin
    const targetRoles = await getUserRoles(targetUser.id);
    if (targetRoles.includes("admin")) {
      return errorResponse("Tidak bisa login sebagai admin lain", 403);
    }

    const targetPermissions = await getUserPermissions(targetUser.id);

    // Create new session as target user, store original admin id
    const token = await encode({
      token: {
        id: String(targetUser.id),
        name: targetUser.name,
        email: targetUser.email,
        roles: targetRoles,
        permissions: targetPermissions,
        impersonatorId: String(context.userId),
      },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
    });

    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === "production";
    cookieStore.set("authjs.session-token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return successResponse("Berhasil login sebagai user lain", {
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        roles: targetRoles,
        permissions: targetPermissions,
      },
      impersonating: true,
    });
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});