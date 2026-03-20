import { prisma } from "@/lib/prisma";

const roleInclude = {
  roleHasPermissions: { include: { permission: true } },
  _count: { select: { modelHasRoles: true } },
} as const;

export const roleRepository = {
  async findMany(params: { where: any; orderBy: any; skip: number; take: number }) {
    const { where, orderBy, skip, take } = params;
    return prisma.role.findMany({
      where,
      include: roleInclude,
      orderBy,
      skip,
      take,
    });
  },

  async count(where: any) {
    return prisma.role.count({ where });
  },

  async findById(id: number) {
    return prisma.role.findUnique({
      where: { id },
      include: roleInclude,
    });
  },

  async findByName(name: string, excludeId?: number) {
    return prisma.role.findFirst({
      where: {
        name,
        guardName: "web",
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
  },

  async listAllPermissions() {
    return prisma.permission.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
  },

  async createRole(payload: { name: string; permissions?: string[] }) {
    const { name, permissions } = payload;

    return prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name,
          guardName: "web",
        },
      });

      if (permissions && permissions.length > 0) {
        const permissionRecords = await tx.permission.findMany({
          where: { name: { in: permissions }, guardName: "web" },
          select: { id: true },
        });

        if (permissionRecords.length > 0) {
          await tx.roleHasPermission.createMany({
            data: permissionRecords.map((p) => ({
              roleId: newRole.id,
              permissionId: p.id,
            })),
          });
        }
      }

      return tx.role.findUnique({
        where: { id: newRole.id },
        include: roleInclude,
      });
    });
  },

  async updateRole(payload: { id: number; name: string; permissions?: string[] }) {
    const { id, name, permissions } = payload;

    return prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { name },
      });

      if (permissions) {
        await tx.roleHasPermission.deleteMany({ where: { roleId: id } });

        if (permissions.length > 0) {
          const permissionRecords = await tx.permission.findMany({
            where: { name: { in: permissions }, guardName: "web" },
            select: { id: true },
          });

          if (permissionRecords.length > 0) {
            await tx.roleHasPermission.createMany({
              data: permissionRecords.map((p) => ({
                roleId: id,
                permissionId: p.id,
              })),
            });
          }
        }
      }

      return tx.role.findUnique({
        where: { id },
        include: roleInclude,
      });
    });
  },

  async deleteRole(id: number) {
    return prisma.$transaction(async (tx) => {
      await tx.roleHasPermission.deleteMany({ where: { roleId: id } });
      await tx.modelHasRole.deleteMany({ where: { roleId: id } });
      await tx.role.delete({ where: { id } });
    });
  },
};
