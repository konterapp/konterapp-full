import { prisma } from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

const balanceGroupInclude = {
  balances: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      branchLinks: {
        orderBy: { createdAt: 'asc' as const },
        include: { branch: { select: { uuid: true, code: true, name: true } } },
      },
    },
  },
};

export type SaldoAccountWithBalances = Prisma.AppPosSaldoAccountGetPayload<{ include: typeof balanceGroupInclude }>;

export const posSaldoRepository = {
  runInTransaction<T>(cb: (tx: Prisma.TransactionClient) => Promise<T>) {
    return (prisma as unknown as PrismaClient).$transaction(cb);
  },

  findMany(params: { where: any; skip?: number; take?: number; orderBy: any; withBalances?: boolean }): Promise<any> {
    const { where, skip, take, orderBy, withBalances } = params;
    return prisma.appPosSaldoAccount.findMany({
      where,
      skip,
      take,
      orderBy,
      ...(withBalances ? { include: balanceGroupInclude } : {}),
    });
  },

  count(where: any) {
    return prisma.appPosSaldoAccount.count({ where });
  },

  async findByUuid(uuid: string, withBalances = true): Promise<any> {
    return prisma.appPosSaldoAccount.findFirst({
      where: { uuid },
      ...(withBalances ? { include: balanceGroupInclude } : {}),
    });
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
  }, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appPosSaldoAccount.create({ data });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.appPosSaldoAccount.update({ where: { uuid }, data });
  },

  deleteByUuid(uuid: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appPosSaldoAccount.delete({ where: { uuid } });
  },

  countUsages(uuid: string) {
    return Promise.all([
      prisma.appPosSale.count({ where: { paymentMethodUuid: uuid } }),
      prisma.appPosPpobTransaction.count({ where: { paymentMethodUuid: uuid } }),
    ]);
  },

  findBalanceByUuid(balanceUuid: string) {
    return prisma.appPosSaldoAccountBalance.findFirst({
      where: { uuid: balanceUuid },
      include: {
        saldoAccount: true,
        branchLinks: {
          orderBy: { createdAt: 'asc' as const },
          include: { branch: { select: { uuid: true, code: true, name: true } } },
        },
      },
    });
  },

  findBalanceWithAccount(balanceUuid: string) {
    return prisma.appPosSaldoAccountBalance.findFirst({
      where: { uuid: balanceUuid },
      include: { saldoAccount: { select: { uuid: true, code: true, name: true } } },
    });
  },

  /**
   * Resolve baris pivot untuk kombinasi akun induk + cabang. Dipakai
   * createSale untuk menemukan grup balance yang tepat saat kasir memilih
   * metode bayar di cabang tertentu.
   */
  findBranchLink(accountUuid: string, branchUuid: string) {
    return prisma.appPosSaldoAccountBalanceBranch.findFirst({
      where: { saldoAccountUuid: accountUuid, branchUuid },
    });
  },

  /**
   * Semua link pivot milik 1 cabang -- dipakai fitur "copy pengaturan saldo
   * dari cabang lain" saat buat cabang baru.
   */
  findLinksOfBranch(branchUuid: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appPosSaldoAccountBalanceBranch.findMany({
      where: { branchUuid },
      select: { companyUuid: true, saldoAccountUuid: true, saldoAccountBalanceUuid: true },
    });
  },

  /**
   * Buat baris balance + link pivot-nya ke sekumpulan cabang. Multi-write
   * (1 insert balance + N insert pivot) -- WAJIB dipanggil dalam transaction
   * pemanggil.
   */
  async createBalanceGroupInTx(
    tx: Prisma.TransactionClient,
    data: {
      companyUuid: string;
      saldoAccountUuid: string;
      balance: number;
      branchUuids: string[];
    }
  ) {
    const { companyUuid, saldoAccountUuid, balance, branchUuids } = data;

    const balanceRow = await tx.appPosSaldoAccountBalance.create({
      data: {
        companyUuid,
        saldoAccountUuid,
        balance,
      },
    });

    if (branchUuids.length > 0) {
      await tx.appPosSaldoAccountBalanceBranch.createMany({
        data: branchUuids.map((branchUuid) => ({
          companyUuid,
          saldoAccountUuid,
          saldoAccountBalanceUuid: balanceRow.uuid,
          branchUuid,
        })),
      });
    }

    return balanceRow;
  },

  /**
   * Pindahkan link pivot cabang-cabang tertentu dari grup balance lama ke
   * grup baru (dipakai addBalanceGroup untuk skenario split). Update dilakukan
   * per-baris via updateMany karena tidak ada unique identifier lain.
   */
  reassignBranchesInTx(
    tx: Prisma.TransactionClient,
    data: { saldoAccountUuid: string; branchUuids: string[]; targetBalanceUuid: string }
  ) {
    const { saldoAccountUuid, branchUuids, targetBalanceUuid } = data;
    return tx.appPosSaldoAccountBalanceBranch.updateMany({
      where: { saldoAccountUuid, branchUuid: { in: branchUuids } },
      data: { saldoAccountBalanceUuid: targetBalanceUuid },
    });
  },

  deleteBalanceByUuid(balanceUuid: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appPosSaldoAccountBalance.delete({ where: { uuid: balanceUuid } });
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
   * Tambah/kurangi balance BARIS BALANCE secara atomik (increment/decrement,
   * bukan read-then-absolute-write) lalu catat baris mutasinya. Terima Prisma
   * TransactionClient supaya bisa digabung ke transaction domain lain
   * (misal createSale) tanpa nested prisma.$transaction.
   */
  async applyMutationInTx(
    tx: Prisma.TransactionClient,
    params: {
      saldoAccountBalanceUuid: string;
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
    const { saldoAccountBalanceUuid, companyUuid, branchUuid, direction, amount, referenceType, referenceUuid, notes, createdBy } = params;

    const before = await tx.appPosSaldoAccountBalance.findUniqueOrThrow({
      where: { uuid: saldoAccountBalanceUuid },
      select: { balance: true },
    });

    const balanceRow = await tx.appPosSaldoAccountBalance.update({
      where: { uuid: saldoAccountBalanceUuid },
      data: {
        balance: direction === 'in' ? { increment: amount } : { decrement: amount },
      },
    });

    const mutation = await tx.appPosSaldoMutation.create({
      data: {
        companyUuid,
        saldoAccountBalanceUuid,
        branchUuid,
        direction,
        amount,
        balanceBefore: before.balance,
        balanceAfter: balanceRow.balance,
        referenceType,
        referenceUuid,
        notes,
        createdBy,
      },
    });

    return { balanceRow, mutation };
  },

  /**
   * Sama seperti applyMutationInTx, tapi buka transaction sendiri -- dipakai
   * dari luar konteks transaction domain lain (koreksi manual, saldo awal).
   */
  applyMutation(params: {
    saldoAccountBalanceUuid: string;
    companyUuid: string;
    branchUuid: string | null;
    direction: 'in' | 'out';
    amount: number;
    referenceType: string;
    referenceUuid: string | null;
    notes: string | null;
    createdBy: number;
  }) {
    return (prisma as unknown as PrismaClient).$transaction((tx) =>
      posSaldoRepository.applyMutationInTx(tx as Prisma.TransactionClient, params)
    );
  },
};
