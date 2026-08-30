import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const shiftInclude = {
  branch: { select: { uuid: true, name: true, code: true } },
  user: { select: { id: true, uuid: true, name: true, email: true } },
  saldoSnapshots: {
    include: {
      saldoAccount: { select: { uuid: true, code: true, name: true, type: true } },
      saldoAccountBalance: { select: { uuid: true, name: true } },
    },
  },
} satisfies Prisma.AppPosCashierShiftInclude;

export type ShiftWithRelations = Prisma.AppPosCashierShiftGetPayload<{ include: typeof shiftInclude }>;

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
      include: shiftInclude,
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
      include: shiftInclude,
    });
  },

  findByUuidForUser(uuid: string, userId: number) {
    return prisma.appPosCashierShift.findFirst({
      where: {
        uuid,
        userId,
      },
      include: shiftInclude,
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
        maxConcurrentUsers: true,
      },
    });
  },

  countOpenByBranch(branchUuid: string) {
    return prisma.appPosCashierShift.count({
      where: { branchUuid, status: 'open' },
    });
  },

  countOpenGroupedByBranch() {
    return prisma.appPosCashierShift.groupBy({
      by: ['branchUuid'],
      where: { status: 'open' },
      _count: { _all: true },
    });
  },

  createInTx(tx: TxClient, data: Prisma.AppPosCashierShiftUncheckedCreateInput) {
    return tx.appPosCashierShift.create({
      data,
      include: shiftInclude,
    });
  },

  updateByUuidInTx(tx: TxClient, uuid: string, data: Prisma.AppPosCashierShiftUpdateInput) {
    return tx.appPosCashierShift.update({
      where: { uuid },
      data,
      include: shiftInclude,
    });
  },

  /**
   * Snapshot saldo per akun utk 1 fase (opening/closing) -- WAJIB dipanggil
   * dalam transaction yang sama dgn createInTx/updateByUuidInTx (1 baris
   * shift + N baris snapshot yg saling terkait).
   */
  createSaldoSnapshotsInTx(tx: TxClient, rows: Prisma.AppPosCashierShiftSaldoSnapshotUncheckedCreateInput[]) {
    if (rows.length === 0) return Promise.resolve({ count: 0 });
    return tx.appPosCashierShiftSaldoSnapshot.createMany({ data: rows });
  },

  findByUuidInTx(tx: TxClient, uuid: string) {
    return tx.appPosCashierShift.findUniqueOrThrow({ where: { uuid }, include: shiftInclude });
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
