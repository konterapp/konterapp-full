import { Prisma } from '@prisma/client';
import { prisma, type TransactionClient } from "@/lib/prisma";
import { v7 as uuidv7 } from 'uuid';

type Client = TransactionClient | typeof prisma;

const roleInclude = {
  roleHasPermissions: { select: { permissionName: true } },
  _count: { select: { modelHasRoles: true } },
} as const;

export const appRoleRepository = {
  runInTransaction<T>(cb: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(cb);
  },

  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.role.findMany({
      where,
      skip,
      take,
      orderBy,
      include: roleInclude,
    });
  },

  count(where: any) {
    return prisma.role.count({ where });
  },

  findByUuid(companyUuid: string, uuid: string) {
    return prisma.role.findFirst({
      where: { companyUuid, uuid },
      include: roleInclude,
    });
  },

  findByName(companyUuid: string, name: string) {
    return prisma.role.findFirst({ where: { companyUuid, name } });
  },

  create(
    tx: Client,
    data: {
      companyUuid: string;
      name: string;
      isFullAccess: boolean;
    }
  ) {
    return tx.role.create({
      data: {
        uuid: uuidv7(),
        companyUuid: data.companyUuid,
        name: data.name,
        isFullAccess: data.isFullAccess,
      },
    });
  },

  updateByUuid(tx: Client, companyUuid: string, uuid: string, data: { name?: string; isFullAccess?: boolean }) {
    return tx.role.update({ where: { uuid }, data });
  },

  deleteByUuid(companyUuid: string, uuid: string) {
    return prisma.role.delete({ where: { uuid } });
  },

  countAssignments(roleId: number) {
    return prisma.modelHasRole.count({ where: { roleId } });
  },

  async replacePermissions(tx: Client, roleId: number, permissions: string[]) {
    await tx.roleHasPermission.deleteMany({ where: { roleId } });
    if (permissions.length > 0) {
      await tx.roleHasPermission.createMany({
        data: permissions.map((permissionName) => ({ roleId, permissionName })),
      });
    }
  },

  clearPermissions(tx: Client, roleId: number) {
    return tx.roleHasPermission.deleteMany({ where: { roleId } });
  },
};
