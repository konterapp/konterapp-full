import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";

function formatUser(user: any) {
  const roles = user.modelHasRoles?.map((r: any) => r.role.name) ?? [];
  return {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    is_active: user.isActive,
    source: user.sourceDb ?? null,
    roles,
    phone_without_dc: user.profile?.phoneWithoutDc ?? null,
    dc: user.profile?.dc ?? null,
    iso: user.profile?.iso ?? null,
    title: user.profile?.title ?? null,
    company: user.profile?.company ?? null,
    work_unit: user.profile?.workUnit ?? null,
    admin_scope: user.profile?.adminScope ?? null,
    avatar_url: user.profile?.avatar ? `/uploads/avatars/${user.profile.avatar}` : null,
    province_id: user.profile?.provinceId ?? null,
    city_id: user.profile?.cityId ?? null,
    wilayah_kode: user.profile?.wilayahKode ?? null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export const PATCH = withPermission("admin.user.update", async (req, context) => {
  try {
    const params = await context.params;
    const uuid = params.uuid;

    const user = await prisma.user.findFirst({
      where: { uuid, deletedAt: null },
    });

    if (!user) {
      return errorResponse("User tidak ditemukan", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isActive: !user.isActive },
      include: {
        profile: true,
        modelHasRoles: { include: { role: true } },
      },
    });

    const message = updatedUser.isActive
      ? "User activated successfully"
      : "User deactivated successfully";

    return successResponse(message, formatUser(updatedUser));
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});