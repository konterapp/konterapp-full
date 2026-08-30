import { prisma } from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

const transactionInclude = {
  branch: { select: { uuid: true, name: true, code: true } },
  saldoAccount: { select: { uuid: true, code: true, name: true } },
  paymentMethod: { select: { uuid: true, code: true, name: true, type: true } },
  creator: { select: { id: true, name: true } },
} satisfies Prisma.AppPosBankAgentTransactionInclude;

export type BankAgentTransactionWithRelations = Prisma.AppPosBankAgentTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export const posBankAgentTransactionRepository = {
  runInTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return (prisma as unknown as PrismaClient).$transaction(callback);
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

  createInTx(tx: Prisma.TransactionClient, data: Prisma.AppPosBankAgentTransactionUncheckedCreateInput) {
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
};
