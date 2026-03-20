import { buildUploadFileUrl } from "@/lib/utils/file-upload";

export function formatUser(user: any, permissions?: string[]) {
  const roles = user.modelHasRoles?.map((r: any) => r.role.name) ?? [];
  const result: any = {
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
    avatar_url: buildUploadFileUrl("avatars", user.profile?.avatar),
    province_id: user.profile?.provinceId ?? null,
    city_id: user.profile?.cityId ?? null,
    wilayah_kode: user.profile?.wilayahKode ?? null,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };

  if (permissions) {
    result.permissions = permissions;
  }

  return result;
}
