'use client';

import { useEffect, useState } from 'react';
import { getShiftBranchSaldo, BranchSaldoItem } from '@/lib/api/app/branch';

/**
 * Fetch saldo cabang (utk ditampilkan saat buka/tutup shift) + kelola input
 * "jumlah aktual" per akun (opsional, dipakai hitung Selisih di backend).
 * Dipakai bareng di /app/pos (layar Kasir) dan /app/pos/shifts (menu Shift
 * Kasir) supaya form buka/tutup shift konsisten di kedua tempat.
 */
export function useBranchSaldoActual(branchUuid: string | null | undefined, enabled: boolean) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<BranchSaldoItem[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [actualBalances, setActualBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!enabled || !branchUuid) {
      setIsLoading(false);
      setError('');
      setItems([]);
      setTotalBalance(0);
      setActualBalances({});
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError('');
    setActualBalances({});

    getShiftBranchSaldo(branchUuid)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 'success' && res.data) {
          setItems(res.data.data || []);
          setTotalBalance(res.data.total_balance || 0);
        } else {
          setError(res.message || 'Gagal memuat saldo cabang');
          setItems([]);
          setTotalBalance(0);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Gagal memuat saldo cabang');
        setItems([]);
        setTotalBalance(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [branchUuid, enabled]);

  const setActualBalance = (groupUuid: string, value: string) => {
    setActualBalances((prev) => ({ ...prev, [groupUuid]: value }));
  };

  const resetActualBalances = () => setActualBalances({});

  const toActualBalancesPayload = (): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const [uuid, raw] of Object.entries(actualBalances)) {
      if (raw.trim() === '') continue;
      const value = Number(raw);
      if (!Number.isNaN(value)) result[uuid] = value;
    }
    return result;
  };

  return {
    isLoading,
    error,
    items,
    totalBalance,
    actualBalances,
    setActualBalance,
    resetActualBalances,
    toActualBalancesPayload,
  };
}
