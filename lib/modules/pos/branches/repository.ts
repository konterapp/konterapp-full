import { prisma } from '@/lib/prisma';

export const posBranchRepository = {
  findMany(params: { where: any; skip: number; take: number }) {
    const { where, skip, take } = params;
    return prisma.posBranch.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  count(where: any) {
    return prisma.posBranch.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posBranch.findFirst({ where: { uuid } });
  },

  findByCode(code: string) {
    return prisma.posBranch.findUnique({ where: { code } });
  },

  create(data: {
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    isActive: boolean;
    isMain: boolean;
  }) {
    return prisma.posBranch.create({ data });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.posBranch.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.posBranch.delete({ where: { uuid } });
  },

  unsetOtherMainBranches(uuidToKeep?: string) {
    return prisma.posBranch.updateMany({
      where: {
        isMain: true,
        ...(uuidToKeep ? { NOT: { uuid: uuidToKeep } } : {}),
      },
      data: { isMain: false },
    });
  },

  countDependencies(uuid: string) {
    return Promise.all([
      prisma.posSale.count({ where: { branchUuid: uuid } }),
      prisma.posPurchase.count({ where: { branchUuid: uuid } }),
      prisma.posProductStock.count({ where: { branchUuid: uuid } }),
    ]);
  },

  listSimple() {
    return prisma.posBranch.findMany({
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
