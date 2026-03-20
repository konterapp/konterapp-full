import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError, paginatedResponse } from "@/lib/response";
import { validateSchema } from "@/lib/validation";
import { createRoleSchema } from "@/lib/validations/role";
import { withPermission } from "@/lib/api-middleware";

function formatRole(role: any) {
  return {
    id: role.id,
    name: role.name,
    guard_name: role.guardName,
    permissions: role.roleHasPermissions?.map((rp: any) => rp.permission.name) ?? [],
    permissions_count: role.roleHasPermissions?.length ?? role._count?.roleHasPermissions ?? 0,
    users_count: role._count?.modelHasRoles ?? 0,
    created_at: role.createdAt,
    updated_at: role.updatedAt,
  };
}

export const GET = withPermission("admin.role.index", async (req) => {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") ?? 10)));
    const search = url.searchParams.get("search") ?? "";
    const sortBy = url.searchParams.get("sort_by") ?? "id";
    const sortOrder = url.searchParams.get("sort_order") ?? "desc";

    // Sort whitelist
    const allowedSorts = ["id", "name", "created_at"];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : "id";
    const sortDir = sortOrder === "asc" ? "asc" : "desc";

    const sortFieldMap: Record<string, string> = {
      id: "id",
      name: "name",
      created_at: "createdAt",
    };

    const where: any = {};
    if (search) {
      where.name = { contains: search };
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          roleHasPermissions: { include: { permission: true } },
          _count: { select: { modelHasRoles: true } },
        },
        orderBy: { [sortFieldMap[sortField]]: sortDir },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.role.count({ where }),
    ]);

    const path = url.pathname;

    return paginatedResponse("List Role", roles.map(formatRole), {
      currentPage: page,
      perPage,
      total,
      path,
    });
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const POST = withPermission("admin.role.create", async (req) => {
  try {
    const body = await req.json();

    // Validation
    const result = validateSchema(createRoleSchema, body);
    if (!("data" in result)) return result;
    const validated = result.data;

    // Check name uniqueness
    const existing = await prisma.role.findFirst({
      where: { name: validated.name, guardName: "web" },
    });
    if (existing) {
      return validationError({ name: ["Nama role sudah ada"] });
    }

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name: validated.name,
          guardName: "web",
        },
      });

      // Sync permissions
      if (validated.permissions && validated.permissions.length > 0) {
        const permissions = await tx.permission.findMany({
          where: { name: { in: validated.permissions }, guardName: "web" },
        });

        if (permissions.length > 0) {
          await tx.roleHasPermission.createMany({
            data: permissions.map((p) => ({
              roleId: newRole.id,
              permissionId: p.id,
            })),
          });
        }
      }

      return tx.role.findUnique({
        where: { id: newRole.id },
        include: {
          roleHasPermissions: { include: { permission: true } },
          _count: { select: { modelHasRoles: true } },
        },
      });
    });

    return successResponse("Role created successfully", formatRole(role), 201);
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});