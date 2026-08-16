import { prisma } from '@/lib/prisma';

export const posBranchRepository = {
  findMany(params: { where: any; skip: number; take: number }) {
    const { where, skip, take } = params;
    return prisma.appPosBranch.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  count(where: any) {
    return prisma.appPosBranch.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosBranch.findFirst({ where: { uuid } });
  },

  findByCode(companyUuid: string, code: string) {
    return prisma.appPosBranch.findFirst({ where: { companyUuid, code } });
  },

  create(data: {
    companyUuid: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    isActive: boolean;
    isMain: boolean;
  }) {
    return prisma.appPosBranch.create({ data });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.appPosBranch.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.appPosBranch.delete({ where: { uuid } });
  },

  unsetOtherMainBranches(uuidToKeep?: string) {
    return prisma.appPosBranch.updateMany({
      where: {
        isMain: true,
        ...(uuidToKeep ? { NOT: { uuid: uuidToKeep } } : {}),
      },
      data: { isMain: false },
    });
  },

  countDependencies(uuid: string) {
    return Promise.all([
      prisma.appPosSale.count({ where: { branchUuid: uuid } }),
      prisma.appPosPurchase.count({ where: { branchUuid: uuid } }),
      prisma.appPosProductStock.count({ where: { branchUuid: uuid } }),
    ]);
  },

  listSimple() {
    return prisma.appPosBranch.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        uuid: true,
        code: true,
        name: true,
        isMain: true,
        isActive: true,
      },
    });
  },
};
