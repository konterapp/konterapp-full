'use client';

import type { BranchSaldoItem } from '@/lib/api/app/branch';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface BranchSaldoActualListProps {
  title?: string;
  isLoading: boolean;
  error: string;
  items: BranchSaldoItem[];
  totalBalance: number;
  actualBalances: Record<string, string>;
  onActualBalanceChange: (groupUuid: string, value: string) => void;
  emptyMessage?: string;
}

/**
 * Kartu saldo akun per cabang + input "jumlah aktual" (opsional, dipakai
 * hitung Selisih di backend) -- dipakai bareng saat buka & tutup shift, di
 * /app/pos (layar Kasir) maupun /app/pos/shifts (menu Shift Kasir), supaya
 * kedua form konsisten (dulu masing-masing punya JSX/logic sendiri).
 */
export default function BranchSaldoActualList({
  title,
  isLoading,
  error,
  items,
  totalBalance,
  actualBalances,
  onActualBalanceChange,
  emptyMessage,
}: BranchSaldoActualListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {title && <p className="text-sm font-semibold text-[#142D52] mb-3">{title}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-400">Memuat saldo...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyMessage || 'Belum ada akun saldo untuk cabang ini'}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const key = item.group.uuid;
            const rawActual = actualBalances[key] ?? '';
            const actualNumber = rawActual.trim() === '' ? null : Number(rawActual);
            const variance = actualNumber !== null && !Number.isNaN(actualNumber) ? actualNumber - item.group.balance : null;
            const varianceStyle =
              variance === null
                ? ''
                : variance === 0
                  ? 'bg-gray-100 text-gray-600'
                  : variance > 0
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700';

            return (
              <div
                key={`${item.account.uuid}-${item.group.uuid}`}
                className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 transition-colors hover:border-gray-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.account.name}</p>
                    {item.group.name && <p className="text-xs text-gray-400 truncate">{item.group.name}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[#142D52]">{formatCurrency(item.group.balance)}</p>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                    <input
                      type="number"
                      value={rawActual}
                      onChange={(e) => onActualBalanceChange(key, e.target.value)}
                      placeholder="Jumlah aktual"
                      className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-800 placeholder:text-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                    />
                  </div>
                  {variance !== null && (
                    <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${varianceStyle}`}>
                      {variance > 0 ? '+' : ''}
                      {formatCurrency(variance)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-base font-bold text-[#142D52]">{formatCurrency(totalBalance)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
