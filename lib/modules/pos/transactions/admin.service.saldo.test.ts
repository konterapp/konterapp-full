import { describe, it, expect, vi, beforeEach } from 'vitest';
import { posTransactionService } from './admin.service';
import { posSaldoRepository } from '../saldo/repository';
import { posShiftRepository } from '../shifts/repository';

vi.mock('./repository', () => ({
  posTransactionRepository: {
    runInTransaction: vi.fn(),
  },
}));

vi.mock('../shifts/repository', () => ({
  posShiftRepository: {
    findOpenByUser: vi.fn(),
  },
}));

vi.mock('../saldo/repository', () => ({
  posSaldoRepository: {
    findByUuid: vi.fn(),
    findBranchLink: vi.fn(),
    applyMutationInTx: vi.fn(),
  },
}));

vi.mock('@/lib/tenant-context', () => ({
  getTenantCompanyUuid: vi.fn().mockReturnValue('company-1'),
}));

vi.mock('@/lib/modules/billing/plan-limits', () => ({
  assertTransactionLimit: vi.fn().mockResolvedValue(undefined),
}));

const mockSaldoRepo = posSaldoRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockShiftRepo = posShiftRepository as unknown as Record<string, ReturnType<typeof vi.fn>>;

const basePayload = {
  branchUuid: 'br-1',
  paymentMethodUuid: 'pm-dana',
  saleDate: '2026-04-19',
  items: [{ productUuid: 'prod-1', quantity: 1, unit_price: 10000 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockShiftRepo.findOpenByUser.mockResolvedValue({ branchUuid: 'br-1', branch: { name: 'Pusat' } });
});

describe('posTransactionService.createSale (resolve grup balance per cabang)', () => {
  it('akun saldo divalidasi TANPA include balances (cukup field induk)', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue({
      uuid: 'pm-dana',
      companyUuid: 'company-1',
      isPaymentMethod: true,
      isActive: true,
    });
    mockSaldoRepo.findBranchLink.mockResolvedValue(null);

    await expect(posTransactionService.createSale(basePayload, 7)).rejects.toThrow();
    expect(mockSaldoRepo.findByUuid).toHaveBeenCalledWith('pm-dana', false);
  });

  it('cabang belum ter-link ke grup mana pun -> error spesifik per-cabang, transaksi tidak jalan', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue({
      uuid: 'pm-dana',
      companyUuid: 'company-1',
      isPaymentMethod: true,
      isActive: true,
    });
    mockSaldoRepo.findBranchLink.mockResolvedValue(null);

    await expect(posTransactionService.createSale(basePayload, 7)).rejects.toMatchObject({
      errors: { paymentMethodUuid: ['Metode pembayaran ini belum dikonfigurasi untuk cabang ini'] },
    });
  });

  it('akun bukan metode bayar / nonaktif -> validation error paymentMethodUuid sebelum cek cabang', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue({
      uuid: 'pm-orderkuota',
      companyUuid: 'company-1',
      isPaymentMethod: false,
      isActive: true,
    });

    await expect(posTransactionService.createSale(basePayload, 7)).rejects.toMatchObject({
      errors: { paymentMethodUuid: ['Akun saldo ini tidak bisa dipakai sebagai metode pembayaran'] },
    });
    expect(mockSaldoRepo.findBranchLink).not.toHaveBeenCalled();
  });

  it('link ditemukan -> createSale lanjut resolve dengan pasangan akun+cabang yang tepat', async () => {
    mockSaldoRepo.findByUuid.mockResolvedValue({
      uuid: 'pm-dana',
      companyUuid: 'company-1',
      isPaymentMethod: true,
      isActive: true,
    });
    mockSaldoRepo.findBranchLink.mockResolvedValue({ saldoAccountBalanceUuid: 'bal-dana-shared' });

    await expect(posTransactionService.createSale(basePayload, 7)).rejects.toThrow();
    expect(mockSaldoRepo.findBranchLink).toHaveBeenCalledWith('pm-dana', 'br-1');
  });

  it('shift aktif di cabang lain tetap ditolak lebih dulu', async () => {
    mockShiftRepo.findOpenByUser.mockResolvedValue({ branchUuid: 'br-lain', branch: { name: 'Bandung' } });

    await expect(posTransactionService.createSale(basePayload, 7)).rejects.toMatchObject({
      message: expect.stringContaining('Shift aktif'),
    });
    expect(mockSaldoRepo.findByUuid).not.toHaveBeenCalled();
  });
});
