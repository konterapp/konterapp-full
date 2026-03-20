import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError, paginatedResponse } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { createUserSchema } from "@/lib/validations/user";
import { v7 as uuidv7 } from "uuid";
import { hash } from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";


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

export const GET = withPermission("admin.user.index", async (req) => {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "id";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";
    const role = url.searchParams.get("role") ?? "";
    const source = url.searchParams.get("source") ?? "";

    // Sort whitelist
    const allowedSorts = ["id", "name", "email", "created_at"];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : "id";
    const sortDir = sortOrder === "asc" ? "asc" : "desc";

    // Map sort field to Prisma field name
    const sortFieldMap: Record<string, string> = {
      id: "id",
      name: "name",
      email: "email",
      created_at: "createdAt",
    };

    // Build where clause
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.modelHasRoles = {
        some: {
          role: { name: role },
        },
      };
    }

    if (source) {
      if (source === "local") {
        where.sourceDb = null;
      } else if (source === "mice") {
        where.sourceDb = "mice_auth";
      } else if (source === "event_daerah") {
        where.sourceDb = "event_daerah";
      } else {
        where.sourceDb = source;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          modelHasRoles: { include: { role: true } },
        },
        orderBy: { [sortFieldMap[sortField]]: sortDir },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.user.count({ where }),
    ]);

    const path = url.pathname;

    return paginatedResponse("List User", users.map(formatUser), {
      currentPage: page,
      perPage,
      total,
      path,
    });
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const POST = withPermission("admin.user.create", async (req) => {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let body: any;
    let profilePhotoFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      profilePhotoFile = formData.get("profile_photo") as File | null;
      // Parse numeric fields
      if (body.roles) body.roles = Number(body.roles);
      if (body.province_id) body.province_id = Number(body.province_id);
      if (body.city_id) body.city_id = Number(body.city_id);
    } else {
      body = await req.json();
    }

    // Validation
    const result = validateSchema(createUserSchema, body);
    if (!("data" in result)) return result;
    const validated = result.data;

    // Check email uniqueness
    const existingEmail = await prisma.user.findFirst({
      where: { email: validated.email, deletedAt: null },
    });
    if (existingEmail) {
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
    let avatarFilename: string | null = null;
    if (profilePhotoFile && profilePhotoFile.size > 0) {
      const bytes = await profilePhotoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      avatarFilename = `${uuidv7()}_${profilePhotoFile.name}`;
      const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, avatarFilename), buffer);
    }

    // Determine admin_scope based on role
    const adminScope =
      role.name === "curator" || role.name === "verifikator"
        ? validated.admin_scope ?? null
        : null;

    const dcClean = (validated.dc ?? "").replace("+", "");

    const hashedPassword = await hash(validated.password, 10);

    // Create user + profile + role in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          uuid: uuidv7(),
          name: validated.name,
          email: validated.email,
          password: hashedPassword,
          isActive: true,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: newUser.id,
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
          avatar: avatarFilename,
        },
      });

      await tx.modelHasRole.create({
        data: {
          roleId: role.id,
          modelType: "App\\Models\\User",
          modelId: newUser.id,
        },
      });

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: {
          profile: true,
          modelHasRoles: { include: { role: true } },
        },
      });
    });

    return successResponse("User created successfully", formatUser(user), 201);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});
