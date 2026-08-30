import { describe, it, expect, vi, beforeEach } from 'vitest';
import { posSaldoRepository } from './repository';
import { posBranchRepository } from '@/lib/modules/pos/branches/repository';
import { appUserRepository } from '@/lib/modules/users/app.repository';
import { posSaldoService } from './admin.service';

vi.mock('./repository', () => ({
  posSaldoRepository: {
    runInTransaction: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findByUuid: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    updateByUuid: vi.fn(),
    deleteByUuid: vi.fn(),
    countUsages: vi.fn(),
    findBalanceByUuid: vi.fn(),
    findBalanceWithAccount: vi.fn(),
    findBranchLink: vi.fn(),
    listActiveAccountUuids: vi.fn(),
    findAllOrderedForReorder: vi.fn(),
    updateSortOrderInTx: vi.fn(),
    createBalanceGroupInTx: vi.fn(),
    reassignBranchesInTx: vi.fn(),
    deleteBalanceByUuid: vi.fn(),
    findMutations: vi.fn(),
    countMutations: vi.fn(),
    applyMutationInTx: vi.fn(),
    applyMutation: vi.fn(),
  },
}));

vi.mock('@/lib/modules/pos/branches/repository', () => ({
  posBranchRepository: {
    listSimple: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('@/lib/modules/users/app.repository', () => ({
  appUserRepository: {
    getAssignedBranchUuids: vi.fn(),
  },
}));

const mockSaldoRepo = posSaldoRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockBranchRepo = posBranchRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockUserRepo = appUserRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;

const mockTx = {
  appPosSaldoAccount: { findFirst: vi.fn() },
};

function fullAccount(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'acc-1',
    code: 'CASH',
    name: 'Tunai',
    type: 'cash',
    companyUuid: 'company-1',
    accountNumber: null,
    accountName: null,
    description: null,
    isPaymentMethod: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    balances: [
      {
        uuid: 'bal-1',
        balance: '500000',
        createdAt: new Date(),
        branchLinks: [{ branch: { uuid: 'br-1', code: 'CB001', name: 'Pusat' } }],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSaldoRepo.runInTransaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(mockTx));
  mockSaldoRepo.findAllOrderedForReorder.mockResolvedValue([]);
  mockUserRepo.getAssignedBranchUuids.mockResolvedValue([]);
});

describe('posSaldoService.createAccount', () => {
  const payload = { code: 'CASH', name: 'Tunai', type: 'cash' };

  it('grup balance pertama mencakup SEMUA cabang aktif (bukan yang nonaktif)', async () => {
    mockSaldoRepo.findByCode.mockResolvedValue(null);
    mockBranchRepo.listSimple.mockResolvedValue([
      { uuid: 'br-1', isActive: true },
      { uuid: 'br-2', isActive: false },
      { uuid: 'br-3', isActive: true },
    ]);
    mockSaldoRepo.create.mockResolvedValue({ uuid: 'acc-1' });
    mockSaldoRepo.createBalanceGroupInTx.mockResolvedValue({ uuid: 'bal-1', balance: '0' });
    mockTx.appPosSaldoAccount.findFirst.mockResolvedValue(fullAccount());

    await posSaldoService.createAccount('company-1', 7, payload);

    expect(mockSaldoRepo.createBalanceGroupInTx).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        companyUuid: 'company-1',
        saldoAccountUuid: 'acc-1',
        branchUuids: ['br-1', 'br-3'],
      })
    );
  });

  it('saldo awal > 0 memicu mutasi opening_balance di dalam transaction', async () => {
    mockSaldoRepo.findByCode.mockResolvedValue(null);
    mockBranchRepo.listSimple.mockResolvedValue([{ uuid: 'br-1', isActive: true }]);
    mockSaldoRepo.create.mockResolvedValue({ uuid: 'acc-1' });
    mockSaldoRepo.createBalanceGroupInTx.mockResolvedValue({ uuid: 'bal-1', balance: '0' });
    mockSaldoRepo.applyMutationInTx.mockResolvedValue({ balanceRow: { balance: '50000' } });
    mockTx.appPosSaldoAccount.findFirst.mockResolvedValue(fullAccount());

    await posSaldoService.createAccount('company-1', 7, { ...payload, openingBalance: 50000 });

    expect(mockSaldoRepo.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockSaldoRepo.applyMutationInTx).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        saldoAccountBalanceUuid: 'bal-1',
        direction: 'in',
        amount: 50000,
        referenceType: 'opening_balance',
        createdBy: 7,
      })
    );
  });

  it('saldo awal 0 TIDAK membuat mutasi', async () => {
    mockSaldoRepo.findByCode.mockResolvedValue(null);
    mockBranchRepo.listSimple.mockResolvedValue([{ uuid: 'br-1', isActive: true }]);
    mockSaldoRepo.create.mockResolvedValue({ uuid: 'acc-1' });
    mockSaldoRepo.createBalanceGroupInTx.mockResolvedValue({ uuid: 'bal-1', balance: '0' });
    mockTx.appPosSaldoAccount.findFirst.mockResolvedValue(fullAccount({ balances: [] }));

    await posSaldoService.createAccount('company-1', 7, payload);

    expect(mockSaldoRepo.applyMutationInTx).not.toHaveBeenCalled();
  });

  it('kode duplikat ditolak dengan validation error field code', async () => {
    mockSaldoRepo.findByCode.mockResolvedValue({ uuid: 'existing' });

    await expect(posSaldoService.createAccount('company-1', 7, payload)).rejects.toMatchObject({
      name: 'ValidationApiError',
      errors: { code: ['Kode akun saldo sudah digunakan'] },
    });
    expect(mockSaldoRepo.runInTransaction).not.toHaveBeenCalled();
  });
});

describe('posSaldoService.addBalanceGroup', () => {
  const payload = { branchUuids: ['br-2'], openingBalance: 100000 };

  it('membuat grup baru lalu REASSIGN cabang dari grup lama ke grup baru', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue(fullAccount());
    mockBranchRepo.count.mockResolvedValue(1);
    mockSaldoRepo.createBalanceGroupInTx.mockResolvedValue({ uuid: 'bal-new', balance: '0' });
    mockSaldoRepo.applyMutationInTx.mockResolvedValue({ balanceRow: { balance: '100000' } });
    mockTx.appPosSaldoAccount.findFirst.mockResolvedValue(
      fullAccount({
        balances: [
          { uuid: 'bal-1', balance: '500000', createdAt: new Date(), branchLinks: [] },
          { uuid: 'bal-new', balance: '0', createdAt: new Date(), branchLinks: [] },
        ],
      })
    );

    const result = await posSaldoService.addBalanceGroup('acc-1', 'company-1', 7, payload);

    expect(mockSaldoRepo.reassignBranchesInTx).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        saldoAccountUuid: 'acc-1',
        branchUuids: ['br-2'],
        targetBalanceUuid: 'bal-new',
      })
    );
    // rollup = grup lama + nilai final grup baru
    expect(result.balance).toBe(600000);
    expect(result.balances_count).toBe(2);
  });

  it('akun tidak ditemukan -> 404 dan tidak membuka transaction', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue(null);

    await expect(posSaldoService.addBalanceGroup('nope', 'company-1', 7, payload)).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 404,
    });
    expect(mockSaldoRepo.runInTransaction).not.toHaveBeenCalled();
  });

  it('cabang tidak valid -> validation error branch_uuids tanpa menyentuh DB write', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue(fullAccount());
    mockBranchRepo.count.mockResolvedValue(0);

    await expect(
      posSaldoService.addBalanceGroup('acc-1', 'company-1', 7, { branchUuids: ['hantu'] })
    ).rejects.toMatchObject({
      name: 'ValidationApiError',
      errors: { branch_uuids: ['Ada cabang yang tidak ditemukan'] },
    });
    expect(mockSaldoRepo.runInTransaction).not.toHaveBeenCalled();
  });
});

describe('posSaldoService.deleteBalanceGroup', () => {
  it('ditolak kalau saldo grup belum 0', async () => {
    mockSaldoRepo.findBalanceWithAccount.mockResolvedValue({ uuid: 'bal-1', balance: '1000' });

    await expect(posSaldoService.deleteBalanceGroup('bal-1')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 400,
      message: expect.stringContaining('belum 0'),
    });
    expect(mockSaldoRepo.deleteBalanceByUuid).not.toHaveBeenCalled();
  });

  it('boleh dihapus kalau saldo sudah 0', async () => {
    mockSaldoRepo.findBalanceWithAccount.mockResolvedValue({ uuid: 'bal-1', balance: '0' });

    await posSaldoService.deleteBalanceGroup('bal-1');
    expect(mockSaldoRepo.deleteBalanceByUuid).toHaveBeenCalledWith('bal-1');
  });

  it('grup tidak ditemukan -> 404', async () => {
    mockSaldoRepo.findBalanceWithAccount.mockResolvedValue(null);

    await expect(posSaldoService.deleteBalanceGroup('nope')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('posSaldoService.adjustBalance', () => {
  it('pengurangan melebihi saldo grup -> validation error amount', async () => {
    mockSaldoRepo.findBalanceByUuid.mockResolvedValue({ uuid: 'bal-1', saldoAccountUuid: 'acc-1', balance: '100' });

    await expect(
      posSaldoService.adjustBalance('bal-1', 'company-1', 7, { direction: 'out', amount: 200, notes: 'x' })
    ).rejects.toMatchObject({
      name: 'ValidationApiError',
      errors: { amount: ['Saldo tidak cukup untuk pengurangan sebesar ini'] },
    });
    expect(mockSaldoRepo.applyMutation).not.toHaveBeenCalled();
  });

  it('koreksi masuk membuat mutasi manual_adjustment pada GRUP yang tepat', async () => {
    mockSaldoRepo.findBalanceByUuid.mockResolvedValue({ uuid: 'bal-2', saldoAccountUuid: 'acc-1', balance: '0' });
    mockSaldoRepo.findByUuid.mockResolvedValue(fullAccount());

    await posSaldoService.adjustBalance('bal-2', 'company-1', 7, { direction: 'in', amount: 25000, notes: 'top up' });

    expect(mockSaldoRepo.applyMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        saldoAccountBalanceUuid: 'bal-2',
        direction: 'in',
        amount: 25000,
        referenceType: 'manual_adjustment',
        createdBy: 7,
      })
    );
  });

  it('grup balance tidak ditemukan -> 404', async () => {
    mockSaldoRepo.findBalanceByUuid.mockResolvedValue(null);

    await expect(
      posSaldoService.adjustBalance('nope', 'company-1', 7, { direction: 'in', amount: 1, notes: 'x' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('posSaldoService.deleteAccount', () => {
  it('ditolak kalau akun masih dipakai transaksi', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue(fullAccount());
    mockSaldoRepo.countUsages.mockResolvedValue([3, 0]);

    await expect(posSaldoService.deleteAccount('acc-1')).rejects.toMatchObject({
      message: expect.stringContaining('sudah dipakai'),
      statusCode: 400,
    });
  });

  it('ditolak kalau masih ada grup dengan saldo belum 0', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue(
      fullAccount({
        balances: [
          { uuid: 'g1', balance: '0' },
          { uuid: 'g2', balance: '500' },
        ],
      })
    );
    mockSaldoRepo.countUsages.mockResolvedValue([0, 0]);

    await expect(posSaldoService.deleteAccount('acc-1')).rejects.toMatchObject({
      message: expect.stringContaining('belum 0'),
    });
    expect(mockSaldoRepo.deleteByUuid).not.toHaveBeenCalled();
  });

  it('lolos kalau tak terpakai dan semua grup 0', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue(fullAccount({ balances: [{ uuid: 'g1', balance: '0' }] }));
    mockSaldoRepo.countUsages.mockResolvedValue([0, 0]);

    await posSaldoService.deleteAccount('acc-1');
    expect(mockSaldoRepo.deleteByUuid).toHaveBeenCalledWith('acc-1');
  });
});

describe('posSaldoService.listMutations', () => {
  it('filter per grup balance lewat where saldoAccountBalanceUuid', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue({ uuid: 'acc-1' });
    mockSaldoRepo.findMutations.mockResolvedValue([]);
    mockSaldoRepo.countMutations.mockResolvedValue(0);

    await posSaldoService.listMutations('acc-1', { page: 1, perPage: 10, balanceUuid: 'bal-9', companyUuid: 'company-1', userId: 7 });

    const arg = mockSaldoRepo.findMutations.mock.calls[0][0];
    expect(arg.where).toMatchObject({
      saldoBalance: { saldoAccountUuid: 'acc-1' },
      saldoAccountBalanceUuid: 'bal-9',
    });
  });

  it('tanpa filter hanya scoping ke akun induk', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue({ uuid: 'acc-1' });
    mockSaldoRepo.findMutations.mockResolvedValue([]);
    mockSaldoRepo.countMutations.mockResolvedValue(0);

    await posSaldoService.listMutations('acc-1', { page: 2, perPage: 10, companyUuid: 'company-1', userId: 7 });

    const arg = mockSaldoRepo.findMutations.mock.calls[0][0];
    expect(arg.where).toEqual({ saldoBalance: { saldoAccountUuid: 'acc-1' } });
    expect(arg.skip).toBe(10);
  });
});

describe('posSaldoService.listAccounts (sort by balance)', () => {
  it('sortBy balance mengurutkan berdasarkan rollup turun', async () => {
    mockSaldoRepo.findMany.mockResolvedValue([
      fullAccount({ uuid: 'kecil', balances: [{ uuid: 'g1', balance: '100' }] }),
      fullAccount({ uuid: 'besar', balances: [{ uuid: 'g1', balance: '999' }] }),
    ]);
    mockSaldoRepo.count.mockResolvedValue(2);

    const result = await posSaldoService.listAccounts({
      page: 1,
      perPage: 10,
      search: '',
      isActive: null,
      isPaymentMethod: null,
      sortBy: 'balance',
      sortOrder: 'desc',
      companyUuid: 'company-1',
      userId: 7,
    });

    expect(result.data.map((a: { uuid: string }) => a.uuid)).toEqual(['besar', 'kecil']);
  });

  it('sortBy lain tetap diproses lewat orderBy database + count', async () => {
    mockSaldoRepo.findMany.mockResolvedValue([]);
    mockSaldoRepo.count.mockResolvedValue(0);

    await posSaldoService.listAccounts({
      page: 1,
      perPage: 10,
      search: '',
      isActive: null,
      isPaymentMethod: null,
      sortBy: 'code',
      sortOrder: 'asc',
      companyUuid: 'company-1',
      userId: 7,
    });

    expect(mockSaldoRepo.count).toHaveBeenCalled();
    expect(mockSaldoRepo.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { code: 'asc' } }));
  });
});
