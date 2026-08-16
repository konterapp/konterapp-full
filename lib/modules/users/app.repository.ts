import { prisma } from "@/lib/prisma";
import { TENANT_DEFAULT_ROLE_ADMINISTRATOR } from "@/lib/modules/roles/templates";

const MODEL_TYPE_USER = "App\\Models\\User";

const memberInclude = {
  modelHasRoles: { include: { role: true } },
} as const;

export const appUserRepository = {
  async listMembers(companyUuid: string, where: any, orderBy: any, skip: number, take: number) {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        companyMemberships: { some: { companyUuid } },
        ...where,
      },
      include: memberInclude,
      orderBy,
      skip,
      take,
    });
  },

  async countMembers(companyUuid: string, where: any) {
    return prisma.user.count({
      where: {
        deletedAt: null,
        companyMemberships: { some: { companyUuid } },
        ...where,
      },
    });
  },

  async findMember(companyUuid: string, uuid: string) {
    return prisma.user.findFirst({
      where: {
        uuid,
        deletedAt: null,
        companyMemberships: { some: { companyUuid } },
      },
      include: memberInclude,
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

  async findRoleByUuid(companyUuid: string, uuid: string) {
    return prisma.role.findFirst({
      where: { companyUuid, uuid },
    });
  },

  async listCompanyRoles(companyUuid: string) {
    return prisma.role.findMany({
      where: { companyUuid },
      select: { uuid: true, name: true },
      orderBy: { name: "asc" },
    });
  },

  async countAdmins(companyUuid: string, excludeUserId?: number) {
    return prisma.modelHasRole.count({
      where: {
        companyUuid,
        role: { name: TENANT_DEFAULT_ROLE_ADMINISTRATOR },
        user: { isActive: true, deletedAt: null },
        ...(excludeUserId ? { modelId: { not: excludeUserId } } : {}),
      },
    });
  },

  async createMember(payload: {
    companyUuid: string;
    userData: { uuid: string; name: string; email: string; password: string; isActive: boolean; emailVerifiedAt: Date };
    roleId: number;
  }) {
    const { companyUuid, userData, roleId } = payload;

    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: userData });

      const existingMemberships = await tx.companyUser.count({ where: { userId: newUser.id } });

      await tx.companyUser.create({
        data: {
          companyUuid,
          userId: newUser.id,
          isDefault: existingMemberships === 0,
          isActive: true,
        },
      });

      await tx.modelHasRole.create({
        data: { roleId, modelType: MODEL_TYPE_USER, modelId: newUser.id, companyUuid },
      });

      return newUser;
    });
  },

  async updateUserData(userId: number, userData: Record<string, unknown>) {
    return prisma.user.update({ where: { id: userId }, data: userData });
  },

  async replaceCompanyRole(companyUuid: string, userId: number, roleId: number) {
    await prisma.modelHasRole.deleteMany({
      where: { modelId: userId, modelType: MODEL_TYPE_USER, companyUuid },
    });

    await prisma.modelHasRole.create({
      data: { roleId, modelType: MODEL_TYPE_USER, modelId: userId, companyUuid },
    });
  },

  async removeFromCompany(companyUuid: string, userId: number) {
    await prisma.modelHasRole.deleteMany({
      where: { modelId: userId, modelType: MODEL_TYPE_USER, companyUuid },
    });
    await prisma.companyUser.deleteMany({ where: { companyUuid, userId } });
  },
};
