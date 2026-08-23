import { describe, it, expect, vi, beforeEach } from 'vitest';
import { posBranchRepository } from './repository';
import { posSaldoRepository } from '@/lib/modules/pos/saldo/repository';
import { posBranchService } from './admin.service';

vi.mock('./repository', () => ({
  posBranchRepository: {
    runInTransaction: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findByUuid: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    updateByUuid: vi.fn(),
    deleteByUuid: vi.fn(),
    countDependencies: vi.fn(),
    listSimple: vi.fn(),
    unsetOtherMainBranches: vi.fn(),
  },
}));

vi.mock('@/lib/modules/pos/saldo/repository', () => ({
  posSaldoRepository: {
    listActiveAccountUuids: vi.fn(),
    createBalanceGroupInTx: vi.fn(),
  },
}));

vi.mock('@/lib/modules/billing/plan-limits', () => ({
  assertBranchLimit: vi.fn().mockResolvedValue(undefined),
}));

const mockRepo = posBranchRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockSaldoRepo = posSaldoRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;

const mockTx = {};

beforeEach(() => {
  vi.clearAllMocks();
  mockRepo.runInTransaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(mockTx));
  mockRepo.findByCode.mockResolvedValue(null);
  mockRepo.count.mockResolvedValue(0);
  mockSaldoRepo.listActiveAccountUuids.mockResolvedValue([]);
});

describe('posBranchService.createBranch (auto-provision grup balance saldo)', () => {
  const basePayload = { code: 'CB004', name: 'Cabang Baru' };

  it('company belum punya akun saldo -> tidak bikin grup balance apa pun', async () => {
    mockRepo.create.mockResolvedValue({ uuid: 'br-new', code: 'CB004', name: 'Cabang Baru' });
    mockSaldoRepo.listActiveAccountUuids.mockResolvedValue([]);

    await posBranchService.createBranch('company-1', basePayload);

    expect(mockSaldoRepo.listActiveAccountUuids).toHaveBeenCalledWith('company-1', mockTx);
    expect(mockSaldoRepo.createBalanceGroupInTx).not.toHaveBeenCalled();
  });

  it('cabang baru otomatis dapat grup balance TERPISAH (saldo 0) untuk tiap akun saldo aktif', async () => {
    mockRepo.create.mockResolvedValue({ uuid: 'br-new', code: 'CB004', name: 'Cabang Baru' });
    mockSaldoRepo.listActiveAccountUuids.mockResolvedValue([{ uuid: 'acc-cash' }, { uuid: 'acc-dana' }]);

    await posBranchService.createBranch('company-1', basePayload);

    expect(mockSaldoRepo.createBalanceGroupInTx).toHaveBeenCalledTimes(2);
    expect(mockSaldoRepo.createBalanceGroupInTx).toHaveBeenCalledWith(mockTx, {
      companyUuid: 'company-1',
      saldoAccountUuid: 'acc-cash',
      balance: 0,
      branchUuids: ['br-new'],
    });
    expect(mockSaldoRepo.createBalanceGroupInTx).toHaveBeenCalledWith(mockTx, {
      companyUuid: 'company-1',
      saldoAccountUuid: 'acc-dana',
      balance: 0,
      branchUuids: ['br-new'],
    });
  });

  it('kode duplikat tetap ditolak sebelum urusan saldo', async () => {
    mockRepo.findByCode.mockResolvedValue({ uuid: 'existing' });

    await expect(posBranchService.createBranch('company-1', basePayload)).rejects.toMatchObject({
      errors: { code: ['Kode cabang sudah digunakan'] },
    });
    expect(mockSaldoRepo.listActiveAccountUuids).not.toHaveBeenCalled();
  });
});
