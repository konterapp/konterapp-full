import { prisma } from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

const transactionInclude = {
  branch: { select: { uuid: true, name: true, code: true } },
  saldoAccount: { select: { uuid: true, code: true, name: true } },
  paymentMethod: { select: { uuid: true, code: true, name: true, type: true } },
  transactionType: { select: { uuid: true, name: true, cashDirection: true } },
  creator: { select: { id: true, name: true } },
} satisfies Prisma.AppPosPpobTransactionInclude;

export type PpobTransactionWithRelations = Prisma.AppPosPpobTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export const posPpobTransactionRepository = {
  runInTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return (prisma as unknown as PrismaClient).$transaction(callback);
  },

  findMany(params: {
    where: Prisma.AppPosPpobTransactionWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.AppPosPpobTransactionOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosPpobTransaction.findMany({
      where,
      skip,
      take,
      orderBy,
      include: transactionInclude,
    });
  },

  count(where: Prisma.AppPosPpobTransactionWhereInput) {
    return prisma.appPosPpobTransaction.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosPpobTransaction.findFirst({
      where: { uuid },
      include: transactionInclude,
    });
  },

  createInTx(tx: Prisma.TransactionClient, data: Prisma.AppPosPpobTransactionUncheckedCreateInput) {
    return tx.appPosPpobTransaction.create({
      data,
      include: transactionInclude,
    });
  },

  findBranchLink(saldoAccountUuid: string, branchUuid: string) {
    return prisma.appPosSaldoAccountBalanceBranch.findFirst({
      where: { saldoAccountUuid, branchUuid },
    });
  },

  // ==================== Jenis Transaksi (master data dinamis) ====================

  findTypeMany(params: { where: Prisma.AppPosPpobTransactionTypeWhereInput; orderBy: Prisma.AppPosPpobTransactionTypeOrderByWithRelationInput }) {
    return prisma.appPosPpobTransactionType.findMany({ where: params.where, orderBy: params.orderBy });
  },

  findTypeByUuid(uuid: string) {
    return prisma.appPosPpobTransactionType.findFirst({ where: { uuid } });
  },

  findTypeByName(companyUuid: string, name: string) {
    return prisma.appPosPpobTransactionType.findFirst({ where: { companyUuid, name } });
  },

  createType(data: Prisma.AppPosPpobTransactionTypeUncheckedCreateInput) {
    return prisma.appPosPpobTransactionType.create({ data });
  },

  updateTypeByUuid(uuid: string, data: Prisma.AppPosPpobTransactionTypeUncheckedUpdateInput) {
    return prisma.appPosPpobTransactionType.update({ where: { uuid }, data });
  },

  deleteTypeByUuid(uuid: string) {
    return prisma.appPosPpobTransactionType.delete({ where: { uuid } });
  },

  countTransactionsByType(transactionTypeUuid: string) {
    return prisma.appPosPpobTransaction.count({ where: { transactionTypeUuid } });
  },
};
