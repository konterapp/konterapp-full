import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posSaldoRepository } from './repository';
import { mapSaldoAccount, mapSaldoMutation } from './saldo.mapper';

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
      balance: 'balance',
      is_active: 'isActive',
    };
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [accounts, total] = await Promise.all([
      posSaldoRepository.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortDir },
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

    const account = await posSaldoRepository.create({
      companyUuid,
      code: payload.code,
      name: payload.name,
      type: payload.type || 'cash',
      accountNumber: payload.accountNumber || null,
      accountName: payload.accountName || null,
      description: payload.description || null,
      isPaymentMethod: payload.isPaymentMethod ?? true,
      isActive: payload.isActive ?? true,
      balance: 0,
    });

    const openingBalance = payload.openingBalance || 0;
    if (openingBalance > 0) {
      const { account: updated } = await posSaldoRepository.applyMutation({
        saldoAccountUuid: account.uuid,
        companyUuid,
        branchUuid: null,
        direction: 'in',
        amount: openingBalance,
        referenceType: 'opening_balance',
        referenceUuid: null,
        notes: 'Saldo awal',
        createdBy: userId,
      });
      return mapSaldoAccount(updated);
    }

    return mapSaldoAccount(account);
  },

  async updateAccount(
    uuid: string,
    companyUuid: string,
    payload: {
      code?: string;
      name?: string;
      type?: string;
      accountNumber?: string | null;
      accountName?: string | null;
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
      accountNumber: payload.accountNumber ?? existing.accountNumber,
      accountName: payload.accountName ?? existing.accountName,
      description: payload.description ?? existing.description,
      isPaymentMethod: payload.isPaymentMethod ?? existing.isPaymentMethod,
      isActive: payload.isActive ?? existing.isActive,
    });
    return mapSaldoAccount(account);
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
    if (Number(account.balance) !== 0) {
      throw new ApiError('Akun saldo tidak bisa dihapus karena saldonya belum 0. Koreksi saldo ke 0 dulu.', 400);
    }

    await posSaldoRepository.deleteByUuid(uuid);
  },

  async listMutations(uuid: string, params: { page: number; perPage: number }) {
    const account = await posSaldoRepository.findByUuid(uuid);
    if (!account) {
      throw new ApiError('Akun saldo tidak ditemukan', 404);
    }

    const { page, perPage } = params;
    const skip = (page - 1) * perPage;
    const where = { saldoAccountUuid: uuid };

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
    uuid: string,
    companyUuid: string,
    userId: number,
    payload: { direction: 'in' | 'out'; amount: number; notes: string; branchUuid?: string | null }
  ) {
    const account = await posSaldoRepository.findByUuid(uuid);
    if (!account) {
      throw new ApiError('Akun saldo tidak ditemukan', 404);
    }

    if (payload.direction === 'out' && Number(account.balance) < payload.amount) {
      throw new ValidationApiError({ amount: ['Saldo tidak cukup untuk pengurangan sebesar ini'] });
    }

    const { account: updated } = await posSaldoRepository.applyMutation({
      saldoAccountUuid: uuid,
      companyUuid,
      branchUuid: payload.branchUuid || null,
      direction: payload.direction,
      amount: payload.amount,
      referenceType: 'manual_adjustment',
      referenceUuid: null,
      notes: payload.notes,
      createdBy: userId,
    });

    return mapSaldoAccount(updated);
  },
};
