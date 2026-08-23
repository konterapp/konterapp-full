import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const posSaldoRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosSaldoAccount.findMany({ where, skip, take, orderBy });
  },

  count(where: any) {
    return prisma.appPosSaldoAccount.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosSaldoAccount.findFirst({ where: { uuid } });
  },

  findByCode(companyUuid: string, code: string) {
    return prisma.appPosSaldoAccount.findFirst({ where: { companyUuid, code } });
  },

  create(data: {
    companyUuid: string;
    code: string;
    name: string;
    type: string;
    accountNumber: string | null;
    accountName: string | null;
    description: string | null;
    isPaymentMethod: boolean;
    isActive: boolean;
    balance: number;
  }) {
    return prisma.appPosSaldoAccount.create({ data });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.appPosSaldoAccount.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string) {
    return prisma.appPosSaldoAccount.delete({ where: { uuid } });
  },

  countUsages(uuid: string) {
    return Promise.all([
      prisma.appPosSale.count({ where: { paymentMethodUuid: uuid } }),
      prisma.appPosPpobTransaction.count({ where: { paymentMethodUuid: uuid } }),
    ]);
  },

  findMutations(params: { where: any; skip: number; take: number }) {
    const { where, skip, take } = params;
    return prisma.appPosSaldoMutation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { uuid: true, name: true, code: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  },

  countMutations(where: any) {
    return prisma.appPosSaldoMutation.count({ where });
  },

  /**
   * Tambah/kurangi balance akun secara atomik (increment/decrement, bukan
   * read-then-absolute-write) lalu catat baris mutasinya. Terima Prisma
   * TransactionClient supaya bisa digabung ke transaction domain lain
   * (misal createSale) tanpa nested prisma.$transaction.
   */
  async applyMutationInTx(
    tx: Prisma.TransactionClient,
    params: {
      saldoAccountUuid: string;
      companyUuid: string;
      branchUuid: string | null;
      direction: 'in' | 'out';
      amount: number;
      referenceType: string;
      referenceUuid: string | null;
      notes: string | null;
      createdBy: number;
    }
  ) {
    const { saldoAccountUuid, companyUuid, branchUuid, direction, amount, referenceType, referenceUuid, notes, createdBy } = params;

    const before = await tx.appPosSaldoAccount.findUniqueOrThrow({
      where: { uuid: saldoAccountUuid },
      select: { balance: true },
    });

    const account = await tx.appPosSaldoAccount.update({
      where: { uuid: saldoAccountUuid },
      data: {
        balance: direction === 'in' ? { increment: amount } : { decrement: amount },
      },
    });

    const mutation = await tx.appPosSaldoMutation.create({
      data: {
        companyUuid,
        saldoAccountUuid,
        branchUuid,
        direction,
        amount,
        balanceBefore: before.balance,
        balanceAfter: account.balance,
        referenceType,
        referenceUuid,
        notes,
        createdBy,
      },
    });

    return { account, mutation };
  },

  /**
   * Sama seperti applyMutationInTx, tapi buka transaction sendiri -- dipakai
   * dari luar konteks transaction domain lain (koreksi manual, saldo awal).
   */
  applyMutation(params: {
    saldoAccountUuid: string;
    companyUuid: string;
    branchUuid: string | null;
    direction: 'in' | 'out';
    amount: number;
    referenceType: string;
    referenceUuid: string | null;
    notes: string | null;
    createdBy: number;
  }) {
    return prisma.$transaction((tx) => this.applyMutationInTx(tx, params));
  },
};
