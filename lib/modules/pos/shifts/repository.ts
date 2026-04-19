import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const posShiftRepository = {
  findMany(params: {
    where: Prisma.PosCashierShiftWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.PosCashierShiftOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posCashierShift.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        branch: { select: { uuid: true, name: true, code: true } },
        user: { select: { id: true, uuid: true, name: true, email: true } },
      },
    });
  },

  count(where: Prisma.PosCashierShiftWhereInput) {
    return prisma.posCashierShift.count({ where });
  },

  findOpenByUser(userId: number) {
    return prisma.posCashierShift.findFirst({
      where: {
        userId,
        status: 'open',
      },
      orderBy: { openedAt: 'desc' },
      include: {
        branch: { select: { uuid: true, name: true, code: true } },
        user: { select: { id: true, uuid: true, name: true, email: true } },
      },
    });
  },

  findByUuidForUser(uuid: string, userId: number) {
    return prisma.posCashierShift.findFirst({
      where: {
        uuid,
        userId,
      },
      include: {
        branch: { select: { uuid: true, name: true, code: true } },
        user: { select: { id: true, uuid: true, name: true, email: true } },
      },
    });
  },

  findBranchByUuid(uuid: string) {
    return prisma.posBranch.findFirst({
      where: {
        uuid,
        isActive: true,
      },
      select: {
        uuid: true,
        companyUuid: true,
        name: true,
        code: true,
      },
    });
  },

  listBranches() {
    return prisma.posBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  create(data: Prisma.PosCashierShiftUncheckedCreateInput) {
    return prisma.posCashierShift.create({
      data,
      include: {
        branch: { select: { uuid: true, name: true, code: true } },
        user: { select: { id: true, uuid: true, name: true, email: true } },
      },
    });
  },

  updateByUuid(uuid: string, data: Prisma.PosCashierShiftUpdateInput) {
    return prisma.posCashierShift.update({
      where: { uuid },
      data,
      include: {
        branch: { select: { uuid: true, name: true, code: true } },
        user: { select: { id: true, uuid: true, name: true, email: true } },
      },
    });
  },

  sumSales(params: { branchUuid: string; userId: number; startedAt: Date; endedAt: Date }) {
    const { branchUuid, userId, startedAt, endedAt } = params;
    return prisma.posSale.aggregate({
      where: {
        branchUuid,
        createdBy: userId,
        createdAt: {
          gte: startedAt,
          lte: endedAt,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });
  },

  runInTransaction<T>(callback: (tx: TxClient) => Promise<T>) {
    return prisma.$transaction((tx) => callback(tx));
  },
};
