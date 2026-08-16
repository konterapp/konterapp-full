import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const posShiftRepository = {
  findMany(params: {
    where: Prisma.AppPosCashierShiftWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.AppPosCashierShiftOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosCashierShift.findMany({
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

  count(where: Prisma.AppPosCashierShiftWhereInput) {
    return prisma.appPosCashierShift.count({ where });
  },

  findOpenByUser(userId: number) {
    return prisma.appPosCashierShift.findFirst({
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
    return prisma.appPosCashierShift.findFirst({
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
    return prisma.appPosBranch.findFirst({
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
    return prisma.appPosBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  create(data: Prisma.AppPosCashierShiftUncheckedCreateInput) {
    return prisma.appPosCashierShift.create({
      data,
      include: {
        branch: { select: { uuid: true, name: true, code: true } },
        user: { select: { id: true, uuid: true, name: true, email: true } },
      },
    });
  },

  updateByUuid(uuid: string, data: Prisma.AppPosCashierShiftUpdateInput) {
    return prisma.appPosCashierShift.update({
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
    return prisma.appPosSale.aggregate({
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
