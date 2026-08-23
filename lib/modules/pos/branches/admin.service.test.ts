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
    findLinksOfBranch: vi.fn(),
  },
}));

vi.mock('@/lib/modules/billing/plan-limits', () => ({
  assertBranchLimit: vi.fn().mockResolvedValue(undefined),
}));

const mockRepo = posBranchRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockSaldoRepo = posSaldoRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;

const mockTx = {
  appPosSaldoAccountBalanceBranch: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.appPosSaldoAccountBalanceBranch.createMany.mockResolvedValue({ count: 2 });
  mockRepo.runInTransaction.mockImplementation((cb: (tx: unknown) => Promise<unknown>) => cb(mockTx));
  mockRepo.findByCode.mockResolvedValue(null);
  mockRepo.count.mockResolvedValue(0);
});

describe('posBranchService.createBranch (copy pengaturan saldo)', () => {
  const basePayload = { code: 'CB004', name: 'Cabang Baru' };

  it('tanpa copy saldo -> tidak menyentuh pivot saldo sama sekali', async () => {
    mockRepo.create.mockResolvedValue({ uuid: 'br-new', code: 'CB004', name: 'Cabang Baru' });

    await posBranchService.createBranch('company-1', basePayload);

    expect(mockSaldoRepo.findLinksOfBranch).not.toHaveBeenCalled();
    expect(mockTx.appPosSaldoAccountBalanceBranch.createMany).not.toHaveBeenCalled();
  });

  it('dengan copy saldo -> pivot grup balance cabang sumber diduplikasi untuk cabang baru', async () => {
    mockRepo.create.mockResolvedValue({ uuid: 'br-new', code: 'CB004', name: 'Cabang Baru' });
    mockRepo.findByUuid.mockResolvedValue({ uuid: 'br-src', code: 'CB001', name: 'Pusat' });
    mockSaldoRepo.findLinksOfBranch.mockResolvedValue([
      { companyUuid: 'company-1', saldoAccountUuid: 'acc-dana', saldoAccountBalanceUuid: 'bal-dana-shared' },
      { companyUuid: 'company-1', saldoAccountUuid: 'acc-cash', saldoAccountBalanceUuid: 'bal-cash-cb001' },
    ]);

    await posBranchService.createBranch('company-1', { ...basePayload, copySaldoFromBranchUuid: 'br-src' });

    expect(mockSaldoRepo.findLinksOfBranch).toHaveBeenCalledWith('br-src', mockTx);
    expect(mockTx.appPosSaldoAccountBalanceBranch.createMany).toHaveBeenCalledWith({
      data: [
        {
          companyUuid: 'company-1',
          saldoAccountUuid: 'acc-dana',
          saldoAccountBalanceUuid: 'bal-dana-shared',
          branchUuid: 'br-new',
        },
        {
          companyUuid: 'company-1',
          saldoAccountUuid: 'acc-cash',
          saldoAccountBalanceUuid: 'bal-cash-cb001',
          branchUuid: 'br-new',
        },
      ],
    });
  });

  it('sumber tidak punya link saldo -> tidak ada createMany (bukan error)', async () => {
    mockRepo.create.mockResolvedValue({ uuid: 'br-new', code: 'CB004', name: 'Cabang Baru' });
    mockRepo.findByUuid.mockResolvedValue({ uuid: 'br-src' });
    mockSaldoRepo.findLinksOfBranch.mockResolvedValue([]);

    await posBranchService.createBranch('company-1', { ...basePayload, copySaldoFromBranchUuid: 'br-src' });

    expect(mockTx.appPosSaldoAccountBalanceBranch.createMany).not.toHaveBeenCalled();
  });

  it('cabang sumber tidak ditemukan -> validation error field copy_saldo_from_branch_uuid', async () => {
    mockRepo.findByUuid.mockResolvedValue(null);

    await expect(
      posBranchService.createBranch('company-1', { ...basePayload, copySaldoFromBranchUuid: 'hantu' })
    ).rejects.toMatchObject({
      name: 'ValidationApiError',
      errors: { copy_saldo_from_branch_uuid: ['Cabang sumber tidak ditemukan'] },
    });
    expect(mockRepo.runInTransaction).not.toHaveBeenCalled();
  });

  it('kode duplikat tetap ditolak sebelum urusan saldo', async () => {
    mockRepo.findByCode.mockResolvedValue({ uuid: 'existing' });

    await expect(
      posBranchService.createBranch('company-1', { ...basePayload, copySaldoFromBranchUuid: 'br-src' })
    ).rejects.toMatchObject({
      errors: { code: ['Kode cabang sudah digunakan'] },
    });
    expect(mockSaldoRepo.findLinksOfBranch).not.toHaveBeenCalled();
  });
});
