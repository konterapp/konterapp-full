import { prisma } from "@/lib/prisma";

const userInclude = {
  modelHasRoles: { include: { role: true } },
  companyMemberships: { include: { company: true } },
} as const;

export const userRepository = {
  async findMany(where: any, orderBy: any, skip: number, take: number) {
    return prisma.user.findMany({
      where,
      include: userInclude,
      orderBy,
      skip,
      take,
    });
  },

  async count(where: any) {
    return prisma.user.count({ where });
  },

  async findByUuid(uuid: string) {
    return prisma.user.findFirst({
      where: { uuid, deletedAt: null },
      include: userInclude,
    });
  },

  async findByUuidBasic(uuid: string) {
    return prisma.user.findFirst({
      where: { uuid, deletedAt: null },
    });
  },

  async findByEmail(email: string, excludeUuid?: string) {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        ...(excludeUuid ? { NOT: { uuid: excludeUuid } } : {}),
      },
    });
  },

  async findRoleById(roleId: number) {
    return prisma.role.findUnique({ where: { id: roleId } });
  },

  async listRoles() {
    return prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },

  async createWithRole(payload: {
    userData: { uuid: string; name: string; email: string; password: string; isActive: boolean };
    roleId: number;
    companyUuid: string;
  }) {
    const { userData, roleId, companyUuid } = payload;

    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: userData });

      await tx.modelHasRole.create({
        data: {
          roleId,
          modelType: "App\\Models\\User",
          modelId: newUser.id,
        },
      });

      await tx.companyUser.create({
        data: {
          companyUuid,
          userId: newUser.id,
          isDefault: true,
          isActive: true,
        },
      });

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: userInclude,
      });
    });
  },

  async updateWithRole(payload: {
    userId: number;
    roleId: number;
    userData: Record<string, unknown>;
  }) {
    const { userId, roleId, userData } = payload;

    return prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: userData });

      await tx.modelHasRole.deleteMany({
        where: { modelId: userId, modelType: "App\\Models\\User" },
      });

      await tx.modelHasRole.create({
        data: {
          roleId,
          modelType: "App\\Models\\User",
          modelId: userId,
        },
      });

      return tx.user.findUnique({
        where: { id: userId },
        include: userInclude,
      });
    });
  },

  async softDeleteById(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  },

  async toggleActiveById(userId: number, isActive: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: userInclude,
    });
  },
};
