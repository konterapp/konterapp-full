import { prisma } from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * Kalau branchUuids diisi, cuma include baris balance yang ter-link ke
 * salah satu cabang itu -- dipakai buat scoping tampilan Kasir/user yang
 * dibatasi cabangnya (lihat CompanyUserBranch), supaya cuma lihat grup
 * balance cabangnya sendiri, bukan semua grup company.
 */
function buildBalanceGroupInclude(branchUuids?: string[]) {
  return {
    balances: {
      ...(branchUuids && branchUuids.length > 0
        ? { where: { branchLinks: { some: { branchUuid: { in: branchUuids } } } } }
        : {}),
      orderBy: { createdAt: 'asc' as const },
      include: {
        branchLinks: {
          orderBy: { createdAt: 'asc' as const },
          include: { branch: { select: { uuid: true, code: true, name: true } } },
        },
      },
    },
  };
}

export type SaldoAccountWithBalances = Prisma.AppPosSaldoAccountGetPayload<{
  include: ReturnType<typeof buildBalanceGroupInclude>;
}>;

export const posSaldoRepository = {
  runInTransaction<T>(cb: (tx: Prisma.TransactionClient) => Promise<T>) {
    return (prisma as unknown as PrismaClient).$transaction(cb);
  },

  findMany(params: {
    where: any;
    skip?: number;
    take?: number;
    orderBy: any;
    withBalances?: boolean;
    branchUuids?: string[];
  }): Promise<any> {
    const { where, skip, take, orderBy, withBalances, branchUuids } = params;
    const scopedWhere =
      branchUuids && branchUuids.length > 0
        ? { ...where, balances: { some: { branchLinks: { some: { branchUuid: { in: branchUuids } } } } } }
        : where;
    return prisma.appPosSaldoAccount.findMany({
      where: scopedWhere,
      skip,
      take,
      orderBy,
      ...(withBalances ? { include: buildBalanceGroupInclude(branchUuids) } : {}),
    });
  },

  count(where: any, branchUuids?: string[]) {
    const scopedWhere =
      branchUuids && branchUuids.length > 0
        ? { ...where, balances: { some: { branchLinks: { some: { branchUuid: { in: branchUuids } } } } } }
        : where;
    return prisma.appPosSaldoAccount.count({ where: scopedWhere });
  },

  async findByUuid(uuid: string, withBalances = true, branchUuids?: string[]): Promise<any> {
    return prisma.appPosSaldoAccount.findFirst({
      where: { uuid },
      ...(withBalances ? { include: buildBalanceGroupInclude(branchUuids) } : {}),
    });
  },

  findByCode(companyUuid: string, code: string) {
    return prisma.appPosSaldoAccount.findFirst({ where: { companyUuid, code } });
  },

  /**
   * Dipakai kasir buat pilih metode bayar di halaman transaksi -- cuma
   * field minimal (bukan saldo/balance), jadi bisa dilayani tanpa
   * permission pos.saldo.index (yang itu buat kelola menu Saldo, bukan
   * sekadar pilih metode bayar saat jualan).
   */
  listPaymentMethodOptions() {
    return prisma.appPosSaldoAccount.findMany({
      where: { isPaymentMethod: true, isActive: true },
      select: { uuid: true, code: true, name: true, type: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  },

  /** Urutan lengkap 1 company buat kebutuhan geser urutan (naik/turun). */
  findAllOrderedForReorder(companyUuid: string) {
    return prisma.appPosSaldoAccount.findMany({
      where: { companyUuid },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { uuid: true, sortOrder: true },
    });
  },

  updateSortOrderInTx(tx: Prisma.TransactionClient, uuid: string, sortOrder: number) {
    return tx.appPosSaldoAccount.update({ where: { uuid }, data: { sortOrder } });
  },

  create(data: {
    companyUuid: string;
    code: string;
    name: string;
    type: string;
    description: string | null;
    isPaymentMethod: boolean;
    isActive: boolean;
    showInShift: boolean;
    sortOrder: number;
    isBankAgent: boolean;
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
   * Semua akun saldo aktif milik company -- dipakai saat bikin cabang baru
   * supaya cabang itu otomatis dapat grup balance sendiri (terpisah, saldo
   * 0) untuk tiap akun saldo yang ada.
   */
  listActiveAccountUuids(companyUuid: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.appPosSaldoAccount.findMany({
      where: { companyUuid, isActive: true },
      select: { uuid: true },
    });
  },

  /**
   * Semua grup balance (lengkap dengan akun induknya) yang ter-link ke 1
   * cabang -- dipakai halaman "Saldo" di aksi tabel cabang, supaya admin
   * bisa lihat nominal saldo cabang itu tanpa perlu buka tiap akun saldo
   * satu-satu.
   */
  findLinksForBranchWithDetails(branchUuid: string) {
    return prisma.appPosSaldoAccountBalanceBranch.findMany({
      where: { branchUuid },
      include: {
        saldoAccount: { select: { uuid: true, code: true, name: true, type: true, isPaymentMethod: true, showInShift: true } },
        saldoAccountBalance: { select: { uuid: true, name: true, balance: true, accountNumber: true, accountName: true } },
      },
      orderBy: [{ saldoAccount: { sortOrder: 'asc' } }, { saldoAccount: { code: 'asc' } }],
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
      name?: string | null;
      accountNumber?: string | null;
      accountName?: string | null;
    }
  ) {
    const { companyUuid, saldoAccountUuid, balance, branchUuids, name, accountNumber, accountName } = data;

    const balanceRow = await tx.appPosSaldoAccountBalance.create({
      data: {
        companyUuid,
        saldoAccountUuid,
        balance,
        name: name ?? null,
        accountNumber: accountNumber ?? null,
        accountName: accountName ?? null,
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

  /**
   * Edit 1 grup balance: ganti nama + keanggotaan cabang. Cabang yang
   * dipilih tapi masih ter-link ke grup lain akan DIPINDAHKAN ke grup ini
   * (sama seperti addBalanceGroup); cabang yang sebelumnya di grup ini tapi
   * tidak lagi dipilih akan DILEPAS (jadi tidak masuk grup manapun untuk
   * akun ini, bukan dihapus). Multi-write -- WAJIB dipanggil dalam
   * transaction pemanggil.
   */
  async updateBalanceGroupInTx(
    tx: Prisma.TransactionClient,
    data: {
      balanceUuid: string;
      companyUuid: string;
      saldoAccountUuid: string;
      name?: string | null;
      accountNumber?: string | null;
      accountName?: string | null;
      branchUuids: string[];
    }
  ) {
    const { balanceUuid, companyUuid, saldoAccountUuid, name, accountNumber, accountName, branchUuids } = data;

    await tx.appPosSaldoAccountBalance.update({
      where: { uuid: balanceUuid },
      data: { name: name ?? null, accountNumber: accountNumber ?? null, accountName: accountName ?? null },
    });

    // Lepas cabang yang sebelumnya di grup ini tapi tidak lagi dipilih.
    await tx.appPosSaldoAccountBalanceBranch.deleteMany({
      where: { saldoAccountBalanceUuid: balanceUuid, branchUuid: { notIn: branchUuids } },
    });

    if (branchUuids.length > 0) {
      // Pindahkan cabang yang dipilih (dari grup lain kalau ada) ke grup ini.
      await tx.appPosSaldoAccountBalanceBranch.updateMany({
        where: { saldoAccountUuid, branchUuid: { in: branchUuids } },
        data: { saldoAccountBalanceUuid: balanceUuid },
      });

      // Cabang yang dipilih tapi belum pernah punya pivot row sama sekali
      // (baru pertama kali di-link ke akun ini) -> insert baru.
      const existingLinks = await tx.appPosSaldoAccountBalanceBranch.findMany({
        where: { saldoAccountBalanceUuid: balanceUuid },
        select: { branchUuid: true },
      });
      const existingBranchUuids = new Set(existingLinks.map((link) => link.branchUuid));
      const missingBranchUuids = branchUuids.filter((branchUuid) => !existingBranchUuids.has(branchUuid));

      if (missingBranchUuids.length > 0) {
        await tx.appPosSaldoAccountBalanceBranch.createMany({
          data: missingBranchUuids.map((branchUuid) => ({
            companyUuid,
            saldoAccountUuid,
            saldoAccountBalanceUuid: balanceUuid,
            branchUuid,
          })),
        });
      }
    }
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
        saldoBalance: { select: { uuid: true, name: true } },
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
