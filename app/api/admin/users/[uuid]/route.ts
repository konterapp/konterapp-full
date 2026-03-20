import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { updateUserSchema } from "@/lib/validations/user";
import { getUserPermissions } from "@/lib/permissions";
import { hash } from "bcryptjs";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { v7 as uuidv7 } from "uuid";

function formatUser(user: any, permissions?: string[]) {
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
    avatar_url: user.profile?.avatar ? `/uploads/avatars/${user.profile.avatar}` : null,
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

export const GET = withPermission("admin.user.index", async (req, context) => {
  try {
    const params = await context.params;
    const uuid = params.uuid;

    const user = await prisma.user.findFirst({
      where: { uuid, deletedAt: null },
      include: {
        profile: true,
        modelHasRoles: { include: { role: true } },
      },
    });

    if (!user) {
      return errorResponse("User tidak ditemukan", 404);
    }

    const permissions = await getUserPermissions(user.id);

    return successResponse("User retrieved successfully", formatUser(user, permissions));
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const PATCH = withPermission("admin.user.update", async (req, context) => {
  try {
    const params = await context.params;
    const uuid = params.uuid;

    const user = await prisma.user.findFirst({
      where: { uuid, deletedAt: null },
      include: { profile: true },
    });

    if (!user) {
      return errorResponse("User tidak ditemukan", 404);
    }

    const contentType = req.headers.get("content-type") ?? "";
    let body: any;
    let profilePhotoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      profilePhotoFile = formData.get("profile_photo") as File | null;
      if (body.roles) body.roles = Number(body.roles);
      if (body.province_id) body.province_id = Number(body.province_id);
      if (body.city_id) body.city_id = Number(body.city_id);
    } else {
      body = await req.json();
    }

    // Validation
    const result = validateSchema(updateUserSchema, body);
    if (!("data" in result)) return result;
    const validated = result.data;

    // Check email uniqueness (exclude current user)
    const existingUser = await prisma.user.findFirst({
      where: { email: validated.email, deletedAt: null, NOT: { uuid } },
    });
    if (existingUser) {
      return validationError({ email: ["Email sudah terdaftar"] });
    }

    // Check role exists
    const role = await prisma.role.findUnique({ where: { id: validated.roles } });
    if (!role) {
      return validationError({ roles: ["Role tidak valid"] });
    }

    // Role-specific validation
    if (role.name === "pemda" && !validated.wilayah_kode) {
      return validationError({ wilayah_kode: ["Wilayah wajib dipilih"] });
    }
    if (role.name === "pemprov" && !validated.province_id) {
      return validationError({ province_id: ["Provinsi wajib dipilih"] });
    }
    if ((role.name === "curator" || role.name === "verifikator") && !validated.admin_scope) {
      return validationError({ admin_scope: ["Admin scope wajib dipilih"] });
    }

    // Handle avatar upload
    let avatarFilename: string | undefined;
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      const bytes = await profilePhotoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      avatarFilename = `${uuidv7()}_${profilePhotoFile.name}`;
      const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, avatarFilename), buffer);

      // Delete old avatar
      if (user.profile?.avatar) {
        try {
          await unlink(join(process.cwd(), "public", "uploads", "avatars", user.profile.avatar));
        } catch {
          // Ignore if old file doesn't exist
        }
      }
    }

    const adminScope =
      role.name === "curator" || role.name === "verifikator"
        ? validated.admin_scope ?? null
        : null;

    const dcClean = (validated.dc ?? "").replace("+", "");

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user
      const userData: Record<string, unknown> = {
        name: validated.name,
        email: validated.email,
      };
      if (validated.password) {
        userData.password = await hash(validated.password, 10);
      }
      await tx.user.update({ where: { id: user.id }, data: userData });

      // Sync role: delete existing, create new
      await tx.modelHasRole.deleteMany({
        where: { modelId: user.id, modelType: "App\\Models\\User" },
      });
      await tx.modelHasRole.create({
        data: {
          roleId: role.id,
          modelType: "App\\Models\\User",
          modelId: user.id,
        },
      });

      // Update or create profile
      const profileData: Record<string, unknown> = {
        phone: dcClean + (validated.phone_without_dc ?? ""),
        phoneWithoutDc: validated.phone_without_dc ?? null,
        dc: validated.dc ?? null,
        iso: validated.iso ?? null,
        title: validated.title ?? null,
        company: validated.company ?? null,
        workUnit: validated.work_unit ?? null,
        adminScope,
        provinceId: validated.province_id ?? null,
        cityId: validated.city_id ?? null,
        wilayahKode: validated.wilayah_kode ?? null,
      };
      if (avatarFilename !== undefined) {
        profileData.avatar = avatarFilename;
      }

      await tx.userProfile.upsert({
        where: { userId: user.id },
        update: profileData,
        create: { userId: user.id, ...profileData },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
          modelHasRoles: { include: { role: true } },
        },
      });
    });

    return successResponse("User updated successfully", formatUser(updatedUser));
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const DELETE = withPermission("admin.user.delete", async (req, context) => {
  try {
    const params = await context.params;
    const uuid = params.uuid;

    const user = await prisma.user.findFirst({
      where: { uuid, deletedAt: null },
    });

    if (!user) {
      return errorResponse("User tidak ditemukan", 404);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    return successResponse("User deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});