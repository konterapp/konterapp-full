import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, validationError } from "@/lib/response";
import { withPermission } from "@/lib/api-middleware";
import { validateSchema } from "@/lib/validation";
import { updateRoleSchema } from "@/lib/validations/role";

function formatRole(role: any) {
  return {
    id: role.id,
    name: role.name,
    guard_name: role.guardName,
    permissions: role.roleHasPermissions?.map((rp: any) => rp.permission.name) ?? [],
    permissions_count: role.roleHasPermissions?.length ?? 0,
    users_count: role._count?.modelHasRoles ?? 0,
    created_at: role.createdAt,
    updated_at: role.updatedAt,
  };
}

export const GET = withPermission("admin.role.index", async (req, context) => {
  try {
    const params = await context.params;
    const id = Number(params.id);

    if (isNaN(id)) {
      return errorResponse("Invalid role ID", 400);
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        roleHasPermissions: { include: { permission: true } },
        _count: { select: { modelHasRoles: true } },
      },
    });

    if (!role) {
      return errorResponse("Role tidak ditemukan", 404);
    }

    return successResponse("Role retrieved successfully", formatRole(role));
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const PATCH = withPermission("admin.role.update", async (req, context) => {
  try {
    const params = await context.params;
    const id = Number(params.id);

    if (isNaN(id)) {
      return errorResponse("Invalid role ID", 400);
    }

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return errorResponse("Role tidak ditemukan", 404);
    }

    const body = await req.json();

    // Validation
    const result = validateSchema(updateRoleSchema, body);
    if (!("data" in result)) return result;
    const validated = result.data;

    // Check name uniqueness
    const existing = await prisma.role.findFirst({
      where: { name: validated.name, guardName: "web", NOT: { id } },
    });
    if (existing) {
      return validationError({ name: ["Nama role sudah ada"] });
    }

    const updatedRole = await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { name: validated.name },
      });

      // Sync permissions
      if (validated.permissions) {
        await tx.roleHasPermission.deleteMany({
          where: { roleId: id },
        });

        if (validated.permissions.length > 0) {
          const permissions = await tx.permission.findMany({
            where: { name: { in: validated.permissions }, guardName: "web" },
          });

          if (permissions.length > 0) {
            await tx.roleHasPermission.createMany({
              data: permissions.map((p) => ({
                roleId: id,
                permissionId: p.id,
              })),
            });
          }
        }
      }

      return tx.role.findUnique({
        where: { id },
        include: {
          roleHasPermissions: { include: { permission: true } },
          _count: { select: { modelHasRoles: true } },
        },
      });
    });

    return successResponse("Role updated successfully", formatRole(updatedRole));
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});

export const DELETE = withPermission("admin.role.delete", async (req, context) => {
  try {
    const params = await context.params;
    const id = Number(params.id);

    if (isNaN(id)) {
      return errorResponse("Invalid role ID", 400);
    }

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return errorResponse("Role tidak ditemukan", 404);
    }

    await prisma.$transaction(async (tx) => {
      // Delete role permissions
      await tx.roleHasPermission.deleteMany({ where: { roleId: id } });
      // Delete model_has_roles for this role
      await tx.modelHasRole.deleteMany({ where: { roleId: id } });
      // Delete role
      await tx.role.delete({ where: { id } });
    });

    return successResponse("Role deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message ?? "Internal server error", 500);
  }
});