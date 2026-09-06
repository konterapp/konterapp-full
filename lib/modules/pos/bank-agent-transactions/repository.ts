import { prisma, type TransactionClient } from "@/lib/prisma";
import type { Prisma, PrismaClient } from '@prisma/client';

const transactionInclude = {
  branch: { select: { uuid: true, name: true, code: true } },
  saldoAccount: { select: { uuid: true, code: true, name: true } },
  paymentMethod: { select: { uuid: true, code: true, name: true, type: true } },
  transactionType: { select: { uuid: true, name: true, cashDirection: true } },
  creator: { select: { id: true, name: true } },
} satisfies Prisma.AppPosBankAgentTransactionInclude;

export type BankAgentTransactionWithRelations = Prisma.AppPosBankAgentTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export const posBankAgentTransactionRepository = {
  runInTransaction<T>(callback: (tx: TransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  },

  findMany(params: {
    where: Prisma.AppPosBankAgentTransactionWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.AppPosBankAgentTransactionOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosBankAgentTransaction.findMany({
      where,
      skip,
      take,
      orderBy,
      include: transactionInclude,
    });
  },

  count(where: Prisma.AppPosBankAgentTransactionWhereInput) {
    return prisma.appPosBankAgentTransaction.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosBankAgentTransaction.findFirst({
      where: { uuid },
      include: transactionInclude,
    });
  },

  createInTx(tx: TransactionClient, data: Prisma.AppPosBankAgentTransactionUncheckedCreateInput) {
    return tx.appPosBankAgentTransaction.create({
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

  findTypeMany(params: { where: Prisma.AppPosBankAgentTransactionTypeWhereInput; orderBy: Prisma.AppPosBankAgentTransactionTypeOrderByWithRelationInput }) {
    return prisma.appPosBankAgentTransactionType.findMany({ where: params.where, orderBy: params.orderBy });
  },

  findTypeByUuid(uuid: string) {
    return prisma.appPosBankAgentTransactionType.findFirst({ where: { uuid } });
  },

  findTypeByName(companyUuid: string, name: string) {
    return prisma.appPosBankAgentTransactionType.findFirst({ where: { companyUuid, name } });
  },

  createType(data: Prisma.AppPosBankAgentTransactionTypeUncheckedCreateInput) {
    return prisma.appPosBankAgentTransactionType.create({ data });
  },

  updateTypeByUuid(uuid: string, data: Prisma.AppPosBankAgentTransactionTypeUncheckedUpdateInput) {
    return prisma.appPosBankAgentTransactionType.update({ where: { uuid }, data });
  },

  deleteTypeByUuid(uuid: string) {
    return prisma.appPosBankAgentTransactionType.delete({ where: { uuid } });
  },

  countTransactionsByType(transactionTypeUuid: string) {
    return prisma.appPosBankAgentTransaction.count({ where: { transactionTypeUuid } });
  },
};
