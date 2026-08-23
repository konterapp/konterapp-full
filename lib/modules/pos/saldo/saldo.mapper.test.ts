import { describe, it, expect } from 'vitest';
import { mapSaldoAccount, mapSaldoBalanceGroup, mapSaldoMutation } from './saldo.mapper';

describe('mapSaldoBalanceGroup', () => {
  it('maps baris balance + pivot cabang ke bentuk snake_case API', () => {
    const createdAt = new Date('2026-04-19T00:00:00Z');
    const result = mapSaldoBalanceGroup({
      uuid: 'bal-1',
      balance: '150000',
      createdAt,
      branchLinks: [
        { branch: { uuid: 'b1', code: 'CB001', name: 'Pusat' } },
        { branch: { uuid: 'b2', code: 'CB002', name: 'Cabang 2' } },
      ],
    });

    expect(result).toEqual({
      uuid: 'bal-1',
      name: null,
      account_number: null,
      account_name: null,
      balance: 150000,
      branches: [
        { uuid: 'b1', code: 'CB001', name: 'Pusat' },
        { uuid: 'b2', code: 'CB002', name: 'Cabang 2' },
      ],
      created_at: createdAt,
    });
  });

  it('balance string dari DB dikonversi ke number', () => {
    const result = mapSaldoBalanceGroup({ uuid: 'x', balance: '12345.5', branchLinks: [] });
    expect(result.balance).toBe(12345.5);
    expect(typeof result.balance).toBe('number');
  });

  it('branchLinks kosong/null tetap menghasilkan array branches kosong', () => {
    const a = mapSaldoBalanceGroup({ uuid: 'x', balance: 0, branchLinks: [] });
    const b = mapSaldoBalanceGroup({ uuid: 'y', balance: 0 });
    expect(a.branches).toEqual([]);
    expect(b.branches).toEqual([]);
  });

  it('link tanpa relasi branch tidak meledak', () => {
    const result = mapSaldoBalanceGroup({ uuid: 'x', balance: 0, branchLinks: [{ branch: null }] });
    expect(result.branches[0]).toEqual({ uuid: undefined, code: undefined, name: undefined });
  });
});

describe('mapSaldoAccount', () => {
  const baseAccount = {
    uuid: 'acc-1',
    code: 'CASH',
    name: 'Tunai',
    type: 'cash',
    description: null,
    isPaymentMethod: true,
    isActive: true,
    createdAt: new Date('2026-04-19T00:00:00Z'),
    updatedAt: new Date('2026-04-19T00:00:00Z'),
  };

  it('rollup balance = SUM semua grup balance', () => {
    const result = mapSaldoAccount({
      ...baseAccount,
      balances: [
        { uuid: 'g1', balance: '500000', branchLinks: [] },
        { uuid: 'g2', balance: '400000', branchLinks: [] },
        { uuid: 'g3', balance: '350000', branchLinks: [] },
      ],
    });

    expect(result.balance).toBe(1250000);
    expect(result.balances_count).toBe(3);
    expect(result.balances).toHaveLength(3);
  });

  it('tanpa include balances: rollup 0 dan field balances undefined (list ringkas)', () => {
    const result = mapSaldoAccount(baseAccount);
    expect(result.balance).toBe(0);
    expect(result.balances_count).toBe(0);
    expect(result.balances).toBeUndefined();
  });

  it('field API snake_case lengkap', () => {
    const result = mapSaldoAccount({ ...baseAccount, balances: [] });
    expect(result).toMatchObject({
      uuid: 'acc-1',
      code: 'CASH',
      name: 'Tunai',
      type: 'cash',
      is_payment_method: true,
      is_active: true,
    });
    expect(result.created_at).toBeDefined();
    expect(result.updated_at).toBeDefined();
  });

  it('rollup desimal dibulatkan ke 2 angka di belakang koma', () => {
    const result = mapSaldoAccount({
      ...baseAccount,
      balances: [
        { uuid: 'g1', balance: '10000.111', branchLinks: [] },
        { uuid: 'g2', balance: '20000.2222', branchLinks: [] },
      ],
    });
    expect(result.balance).toBe(30000.33);
  });
});

describe('mapSaldoMutation', () => {
  it('maps mutasi lengkap dengan relasi branch & creator', () => {
    const createdAt = new Date('2026-04-19T01:00:00Z');
    const result = mapSaldoMutation({
      uuid: 'mut-1',
      direction: 'in',
      amount: '50000',
      balanceBefore: '100000',
      balanceAfter: '150000',
      referenceType: 'opening_balance',
      referenceUuid: null,
      notes: 'Saldo awal',
      branch: { uuid: 'b1', name: 'Pusat', code: 'CB001' },
      creator: { id: 7, name: 'Kasir A' },
      saldoBalance: { uuid: 'bal-1', name: 'Kas Pusat' },
      createdAt,
    });

    expect(result).toEqual({
      uuid: 'mut-1',
      direction: 'in',
      amount: 50000,
      balance_before: 100000,
      balance_after: 150000,
      reference_type: 'opening_balance',
      reference_uuid: null,
      notes: 'Saldo awal',
      saldo_balance: { uuid: 'bal-1', name: 'Kas Pusat' },
      branch: { uuid: 'b1', name: 'Pusat', code: 'CB001' },
      creator: { id: 7, name: 'Kasir A' },
      created_at: createdAt,
    });
  });

  it('relasi branch/creator/saldoBalance null aman -- mutasi tetap milik grup meski relasinya tidak di-include', () => {
    const result = mapSaldoMutation({
      uuid: 'mut-2',
      direction: 'out',
      amount: '1000',
      balanceBefore: '2000',
      balanceAfter: '1000',
      referenceType: 'manual_adjustment',
      referenceUuid: null,
      notes: null,
      branch: null,
      creator: null,
      saldoBalance: null,
      createdAt: new Date(),
    });
    expect(result.branch).toBeNull();
    expect(result.creator).toBeNull();
    expect(result.saldo_balance).toBeNull();
  });
});
