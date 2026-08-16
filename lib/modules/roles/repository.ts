import { prisma } from '@/lib/prisma';
import { v7 as uuidv7 } from 'uuid';

const roleInclude = {
  roleHasPermissions: { select: { permissionName: true } },
  _count: { select: { modelHasRoles: true } },
} as const;

export const appRoleRepository = {
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

  create(data: {
    companyUuid: string;
    name: string;
    isFullAccess: boolean;
  }) {
    return prisma.role.create({
      data: {
        uuid: uuidv7(),
        companyUuid: data.companyUuid,
        name: data.name,
        isFullAccess: data.isFullAccess,
      },
    });
  },

  updateByUuid(companyUuid: string, uuid: string, data: { name?: string; isFullAccess?: boolean }) {
    return prisma.role.update({ where: { uuid }, data });
  },

  deleteByUuid(companyUuid: string, uuid: string) {
    return prisma.role.delete({ where: { uuid } });
  },

  countAssignments(roleId: number) {
    return prisma.modelHasRole.count({ where: { roleId } });
  },

  replacePermissions(roleId: number, permissions: string[]) {
    return prisma.$transaction([
      prisma.roleHasPermission.deleteMany({ where: { roleId } }),
      ...(permissions.length > 0
        ? [
            prisma.roleHasPermission.createMany({
              data: permissions.map((permissionName) => ({ roleId, permissionName })),
            }),
          ]
        : []),
    ]);
  },

  clearPermissions(roleId: number) {
    return prisma.roleHasPermission.deleteMany({ where: { roleId } });
  },
};
