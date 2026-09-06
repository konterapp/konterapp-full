import { Prisma } from "@prisma/client";
import { prisma, type TransactionClient } from "@/lib/prisma";
import { TENANT_DEFAULT_ROLE_ADMINISTRATOR } from "@/lib/modules/roles/templates";

const MODEL_TYPE_USER = "App\\Models\\User";

type Client = TransactionClient | typeof prisma;

function memberInclude(companyUuid: string) {
  return {
    modelHasRoles: { include: { role: true } },
    companyMemberships: {
      where: { companyUuid },
      include: { branches: { include: { branch: { select: { uuid: true, name: true } } } } },
    },
  } as const;
}

export const appUserRepository = {
  runInTransaction<T>(cb: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(cb);
  },

  async listMembers(companyUuid: string, where: any, orderBy: any, skip: number, take: number) {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        companyMemberships: { some: { companyUuid } },
        ...where,
      },
      include: memberInclude(companyUuid),
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
      include: memberInclude(companyUuid),
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

  async isCompanyMember(companyUuid: string, userId: number) {
    const count = await prisma.companyUser.count({ where: { companyUuid, userId } });
    return count > 0;
  },

  async findRoleByUuid(companyUuid: string, uuid: string) {
    return prisma.role.findFirst({
      where: { companyUuid, uuid },
      include: { roleHasPermissions: { select: { permissionName: true } } },
    });
  },

  async listCompanyRoles(companyUuid: string) {
    return prisma.role.findMany({
      where: { companyUuid },
      select: {
        uuid: true,
        name: true,
        isFullAccess: true,
        roleHasPermissions: { select: { permissionName: true } },
      },
      orderBy: { name: "asc" },
    });
  },

  async listActiveBranches(companyUuid: string) {
    return prisma.appPosBranch.findMany({
      where: { companyUuid, isActive: true },
      select: { uuid: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  },

  async getAssignedBranchUuids(companyUuid: string, userId: number) {
    const companyUser = await prisma.companyUser.findFirst({
      where: { companyUuid, userId },
      select: { branches: { select: { branchUuid: true } } },
    });
    return companyUser?.branches.map((b) => b.branchUuid) ?? [];
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
    userData: { uuid: string; name: string; email: string; password: string; isActive: boolean; emailVerifiedAt: Date | null };
    roleId: number;
    branchUuids: string[];
  }) {
    const { companyUuid, userData, roleId, branchUuids } = payload;

    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({ data: userData });

      const existingMemberships = await tx.companyUser.count({ where: { userId: newUser.id } });

      const companyUser = await tx.companyUser.create({
        data: {
          companyUuid,
          userId: newUser.id,
          isDefault: existingMemberships === 0,
          isActive: true,
          invitationAcceptedAt: null,
        },
      });

      await tx.modelHasRole.create({
        data: { roleId, modelType: MODEL_TYPE_USER, modelId: newUser.id, companyUuid },
      });

      if (branchUuids.length > 0) {
        await tx.companyUserBranch.createMany({
          data: branchUuids.map((branchUuid) => ({ companyUuid, companyUserUuid: companyUser.uuid, branchUuid })),
        });
      }

      return { user: newUser, companyUserUuid: companyUser.uuid };
    });
  },

  async attachExistingMember(payload: { companyUuid: string; userId: number; roleId: number; branchUuids: string[] }) {
    const { companyUuid, userId, roleId, branchUuids } = payload;

    return prisma.$transaction(async (tx) => {
      const existingMemberships = await tx.companyUser.count({ where: { userId } });

      const companyUser = await tx.companyUser.create({
        data: {
          companyUuid,
          userId,
          isDefault: existingMemberships === 0,
          isActive: true,
          invitationAcceptedAt: null,
        },
      });

      await tx.modelHasRole.create({
        data: { roleId, modelType: MODEL_TYPE_USER, modelId: userId, companyUuid },
      });

      if (branchUuids.length > 0) {
        await tx.companyUserBranch.createMany({
          data: branchUuids.map((branchUuid) => ({ companyUuid, companyUserUuid: companyUser.uuid, branchUuid })),
        });
      }

      return { companyUserUuid: companyUser.uuid };
    });
  },

  async updateUserData(tx: Client, userId: number, userData: Record<string, unknown>) {
    return tx.user.update({ where: { id: userId }, data: userData });
  },

  async replaceCompanyRole(tx: Client, companyUuid: string, userId: number, roleId: number) {
    await tx.modelHasRole.deleteMany({
      where: { modelId: userId, modelType: MODEL_TYPE_USER, companyUuid },
    });

    await tx.modelHasRole.create({
      data: { roleId, modelType: MODEL_TYPE_USER, modelId: userId, companyUuid },
    });
  },

  async replaceMemberBranches(tx: Client, companyUuid: string, companyUserUuid: string, branchUuids: string[]) {
    await tx.companyUserBranch.deleteMany({ where: { companyUuid, companyUserUuid } });
    if (branchUuids.length > 0) {
      await tx.companyUserBranch.createMany({
        data: branchUuids.map((branchUuid) => ({ companyUuid, companyUserUuid, branchUuid })),
      });
    }
  },

  async removeFromCompany(tx: Client, companyUuid: string, userId: number) {
    await tx.modelHasRole.deleteMany({
      where: { modelId: userId, modelType: MODEL_TYPE_USER, companyUuid },
    });
    await tx.companyUser.deleteMany({ where: { companyUuid, userId } });
  },
};
