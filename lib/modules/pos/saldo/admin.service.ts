import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posSaldoRepository } from './repository';
import { posBranchRepository } from '@/lib/modules/pos/branches/repository';
import { mapSaldoAccount, mapSaldoMutation } from './saldo.mapper';

function sumBalances(account: any): number {
  if (!account?.balances?.length) return 0;
  return account.balances.reduce((total: number, row: any) => total + Number(row.balance), 0);
}

export const posSaldoService = {
  async listAccounts(params: {
    page: number;
    perPage: number;
    search: string;
    isActive: string | null;
    isPaymentMethod: string | null;
    sortBy: string;
    sortOrder: string;
  }) {
    const { page, perPage, search, isActive, isPaymentMethod, sortBy, sortOrder } = params;
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (isPaymentMethod !== null && isPaymentMethod !== undefined) {
      where.isPaymentMethod = isPaymentMethod === 'true';
    }

    const allowedSorts = ['created_at', 'code', 'name', 'type', 'balance', 'is_active'];
    const sortFieldMap: Record<string, string> = {
      created_at: 'createdAt',
      code: 'code',
      name: 'name',
      type: 'type',
      balance: 'createdAt',
      is_active: 'isActive',
    };
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder === 'asc' ? 'asc' : 'desc';

    // Sort by "balance" = rollup SUM semua grup balance -- tidak bisa
    // di-order oleh database lewat ORM, jadi urutkan di JS (skala data
    // akun saldo per company kecil).
    if (sortField === 'balance') {
      const accounts = await posSaldoRepository.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        withBalances: true,
      });
      accounts.sort((a: any, b: any) => {
        const diff = sumBalances(a) - sumBalances(b);
        return sortOrder === 'asc' ? diff : -diff;
      });
      const total = accounts.length;
      const paged = accounts.slice(skip, skip + perPage);
      return {
        data: paged.map(mapSaldoAccount),
        pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
      };
    }

    const [accounts, total] = await Promise.all([
      posSaldoRepository.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortDir },
        withBalances: true,
      }),
      posSaldoRepository.count(where),
    ]);

    return {
      data: accounts.map(mapSaldoAccount),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getAccount(uuid: string) {
    const account = await posSaldoRepository.findByUuid(uuid);
    if (!account) {
      throw new ApiError('Akun saldo tidak ditemukan', 404);
    }
    return mapSaldoAccount(account);
  },

  async createAccount(
    companyUuid: string,
    userId: number,
    payload: {
      code: string;
      name: string;
      type: string;
      accountNumber?: string | null;
      accountName?: string | null;
      description?: string | null;
      isPaymentMethod?: boolean;
      isActive?: boolean;
      openingBalance?: number;
    }
  ) {
    const existing = await posSaldoRepository.findByCode(companyUuid, payload.code);
    if (existing) {
      throw new ValidationApiError({ code: ['Kode akun saldo sudah digunakan'] });
    }

    // Grup balance pertama otomatis mencakup semua cabang aktif company
    // (split per-cabang dilakukan belakangan lewat "Tambah Grup Balance"
    // di halaman detail akun). Nomor rekening/nama pemilik akun menempel di
    // grup ini (bukan di akun induk), karena tiap grup bisa punya rekening
    // fisik berbeda.
    const branches = await posBranchRepository.listSimple();
    const activeBranchUuids = branches.filter((b) => b.isActive).map((b) => b.uuid);

    return posSaldoRepository.runInTransaction(async (tx) => {
      const account = await posSaldoRepository.create(
        {
          companyUuid,
          code: payload.code,
          name: payload.name,
          type: payload.type || 'cash',
          description: payload.description || null,
          isPaymentMethod: payload.isPaymentMethod ?? true,
          isActive: payload.isActive ?? true,
        },
        tx
      );

      const openingBalance = payload.openingBalance || 0;

      const balanceRow = await posSaldoRepository.createBalanceGroupInTx(tx, {
        companyUuid,
        saldoAccountUuid: account.uuid,
        balance: 0,
        branchUuids: activeBranchUuids,
        accountNumber: payload.accountNumber || null,
        accountName: payload.accountName || null,
      });

      if (openingBalance > 0) {
        await posSaldoRepository.applyMutationInTx(tx, {
          saldoAccountBalanceUuid: balanceRow.uuid,
          companyUuid,
          branchUuid: null,
          direction: 'in',
          amount: openingBalance,
          referenceType: 'opening_balance',
          referenceUuid: null,
          notes: 'Saldo awal',
          createdBy: userId,
        });
      }

      const full = await tx.appPosSaldoAccount.findFirst({
        where: { uuid: account.uuid },
        include: {
          balances: {
            orderBy: { createdAt: 'asc' },
            include: {
              branchLinks: {
                orderBy: { createdAt: 'asc' },
                include: { branch: { select: { uuid: true, code: true, name: true } } },
              },
            },
          },
        },
      });

      return mapSaldoAccount(full ?? account);
    });
  },

  async updateAccount(
    uuid: string,
    companyUuid: string,
    payload: {
      code?: string;
      name?: string;
      type?: string;
      description?: string | null;
      isPaymentMethod?: boolean;
      isActive?: boolean;
    }
  ) {
    const existing = await posSaldoRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Akun saldo tidak ditemukan', 404);
    }

    if (payload.code && payload.code !== existing.code) {
      const codeExists = await posSaldoRepository.findByCode(companyUuid, payload.code);
      if (codeExists) {
        throw new ValidationApiError({ code: ['Kode akun saldo sudah digunakan'] });
      }
    }

    const account = await posSaldoRepository.updateByUuid(uuid, {
      code: payload.code || existing.code,
      name: payload.name || existing.name,
      type: payload.type || existing.type,
      description: payload.description ?? existing.description,
      isPaymentMethod: payload.isPaymentMethod ?? existing.isPaymentMethod,
      isActive: payload.isActive ?? existing.isActive,
    });
    return mapSaldoAccount({ ...account, balances: existing.balances });
  },

  async deleteAccount(uuid: string) {
    const account = await posSaldoRepository.findByUuid(uuid);
    if (!account) {
      throw new ApiError('Akun saldo tidak ditemukan', 404);
    }

    const [salesCount, ppobCount] = await posSaldoRepository.countUsages(uuid);
    if (salesCount > 0 || ppobCount > 0) {
      throw new ApiError('Akun saldo tidak bisa dihapus karena sudah dipakai di transaksi', 400);
    }

    const nonZero = (account.balances ?? []).some((row: any) => Number(row.balance) !== 0);
    if (nonZero) {
      throw new ApiError('Akun saldo tidak bisa dihapus karena masih ada grup dengan saldo belum 0. Koreksi ke 0 dulu.', 400);
    }

    await posSaldoRepository.deleteByUuid(uuid);
  },

  /**
   * Tambah grup balance baru untuk akun induk (skenario split per-cabang).
   * Cabang yang dipilih dan ternyata masih ter-link ke grup lama akan
   * DIPINDAHKAN ke grup baru ini -- semuanya dalam 1 transaction.
   */
  async addBalanceGroup(
    uuid: string,
    companyUuid: string,
    userId: number,
    payload: {
      branchUuids: string[];
      openingBalance?: number;
      notes?: string | null;
      name?: string | null;
      accountNumber?: string | null;
      accountName?: string | null;
    }
  ) {
    const account = await posSaldoRepository.findByUuid(uuid);
    if (!account) {
      throw new ApiError('Akun saldo tidak ditemukan', 404);
    }

    const branchCount = await posBranchRepository.count({ companyUuid, uuid: { in: payload.branchUuids } });
    if (branchCount !== payload.branchUuids.length) {
      throw new ValidationApiError({ branch_uuids: ['Ada cabang yang tidak ditemukan'] });
    }

    const openingBalance = payload.openingBalance || 0;

    return posSaldoRepository.runInTransaction(async (tx) => {
      const balanceRow = await posSaldoRepository.createBalanceGroupInTx(tx, {
        companyUuid,
        saldoAccountUuid: uuid,
        balance: 0,
        branchUuids: [],
        name: payload.name || null,
        accountNumber: payload.accountNumber || null,
        accountName: payload.accountName || null,
      });

      await posSaldoRepository.reassignBranchesInTx(tx, {
        saldoAccountUuid: uuid,
        branchUuids: payload.branchUuids,
        targetBalanceUuid: balanceRow.uuid,
      });

      let finalBalance = 0;
      if (openingBalance > 0) {
        const { balanceRow: updated } = await posSaldoRepository.applyMutationInTx(tx, {
          saldoAccountBalanceUuid: balanceRow.uuid,
          companyUuid,
          branchUuid: null,
          direction: 'in',
          amount: openingBalance,
          referenceType: 'opening_balance',
          referenceUuid: null,
          notes: payload.notes || 'Saldo awal grup baru',
          createdBy: userId,
        });
        finalBalance = Number(updated.balance);
      }

      const full = await tx.appPosSaldoAccount.findFirst({
        where: { uuid },
        include: {
          balances: {
            orderBy: { createdAt: 'asc' },
            include: {
              branchLinks: {
                orderBy: { createdAt: 'asc' },
                include: { branch: { select: { uuid: true, code: true, name: true } } },
              },
            },
          },
        },
      });

      if (!full) {
        throw new ApiError('Akun saldo tidak ditemukan', 404);
      }
      if (finalBalance > 0) {
        const newRow = full.balances.findIndex((row) => row.uuid === balanceRow.uuid);
        if (newRow >= 0) {
          full.balances[newRow] = { ...full.balances[newRow], balance: finalBalance as any };
        }
      }

      return mapSaldoAccount(full);
    });
  },

  /**
   * Edit grup balance yang sudah ada: ganti nama + keanggotaan cabang.
   * Cabang yang dipilih dan masih ter-link ke grup lain (termasuk akun
   * saldo lain milik company yang sama tidak akan kesenggol, cek di bawah
   * cuma scoped ke saldoAccountUuid grup ini) otomatis dipindahkan ke grup
   * ini; cabang yang sebelumnya di grup ini tapi tidak lagi dipilih akan
   * dilepas (bukan dihapus grupnya).
   */
  async updateBalanceGroup(
    balanceUuid: string,
    companyUuid: string,
    payload: {
      name?: string | null;
      accountNumber?: string | null;
      accountName?: string | null;
      branchUuids: string[];
    }
  ) {
    const balanceRow = await posSaldoRepository.findBalanceWithAccount(balanceUuid);
    if (!balanceRow) {
      throw new ApiError('Grup balance tidak ditemukan', 404);
    }

    const branchCount = await posBranchRepository.count({ companyUuid, uuid: { in: payload.branchUuids } });
    if (branchCount !== payload.branchUuids.length) {
      throw new ValidationApiError({ branch_uuids: ['Ada cabang yang tidak ditemukan'] });
    }

    return posSaldoRepository.runInTransaction(async (tx) => {
      await posSaldoRepository.updateBalanceGroupInTx(tx, {
        balanceUuid,
        companyUuid,
        saldoAccountUuid: balanceRow.saldoAccountUuid,
        name: payload.name ?? null,
        accountNumber: payload.accountNumber ?? null,
        accountName: payload.accountName ?? null,
        branchUuids: payload.branchUuids,
      });

      const full = await tx.appPosSaldoAccount.findFirst({
        where: { uuid: balanceRow.saldoAccountUuid },
        include: {
          balances: {
            orderBy: { createdAt: 'asc' },
            include: {
              branchLinks: {
                orderBy: { createdAt: 'asc' },
                include: { branch: { select: { uuid: true, code: true, name: true } } },
              },
            },
          },
        },
      });

      if (!full) {
        throw new ApiError('Akun saldo tidak ditemukan', 404);
      }

      return mapSaldoAccount(full);
    });
  },

  async deleteBalanceGroup(balanceUuid: string) {
    const balanceRow = await posSaldoRepository.findBalanceWithAccount(balanceUuid);
    if (!balanceRow) {
      throw new ApiError('Grup balance tidak ditemukan', 404);
    }

    if (Number(balanceRow.balance) !== 0) {
      throw new ApiError('Grup balance tidak bisa dihapus karena saldonya belum 0. Koreksi ke 0 dulu.', 400);
    }

    await posSaldoRepository.deleteBalanceByUuid(balanceUuid);
  },

  async listMutations(uuid: string, params: { page: number; perPage: number; balanceUuid?: string | null }) {
    const account = await posSaldoRepository.findByUuid(uuid, false);
    if (!account) {
      throw new ApiError('Akun saldo tidak ditemukan', 404);
    }

    const { page, perPage, balanceUuid } = params;
    const skip = (page - 1) * perPage;
    const where: any = { saldoBalance: { saldoAccountUuid: uuid } };
    if (balanceUuid) {
      where.saldoAccountBalanceUuid = balanceUuid;
    }

    const [mutations, total] = await Promise.all([
      posSaldoRepository.findMutations({ where, skip, take: perPage }),
      posSaldoRepository.countMutations(where),
    ]);

    return {
      data: mutations.map(mapSaldoMutation),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async adjustBalance(
    balanceUuid: string,
    companyUuid: string,
    userId: number,
    payload: { direction: 'in' | 'out'; amount: number; notes: string; branchUuid?: string | null }
  ) {
    const balanceRow = await posSaldoRepository.findBalanceByUuid(balanceUuid);
    if (!balanceRow) {
      throw new ApiError('Grup balance tidak ditemukan', 404);
    }

    if (payload.direction === 'out' && Number(balanceRow.balance) < payload.amount) {
      throw new ValidationApiError({ amount: ['Saldo tidak cukup untuk pengurangan sebesar ini'] });
    }

    // Mutasi itu milik GRUP (saldo_account_balance_uuid), bukan milik
    // cabang -- branch_uuid di sini cuma buat catat DI CABANG MANA
    // transaksi itu SECARA NYATA terjadi (relevan untuk penjualan). Koreksi
    // manual tidak punya "lokasi" seperti itu, jadi branch_uuid wajar null
    // kecuali admin eksplisit pilih (payload.branchUuid). JANGAN infer dari
    // keanggotaan cabang grup -- itu fakta konfigurasi statis, bukan bukti
    // bahwa koreksi ini "terjadi" di cabang tsb.
    await posSaldoRepository.applyMutation({
      saldoAccountBalanceUuid: balanceUuid,
      companyUuid,
      branchUuid: payload.branchUuid || null,
      direction: payload.direction,
      amount: payload.amount,
      referenceType: 'manual_adjustment',
      referenceUuid: null,
      notes: payload.notes,
      createdBy: userId,
    });

    const account = await posSaldoRepository.findByUuid(balanceRow.saldoAccountUuid);
    return mapSaldoAccount(account);
  },
};
