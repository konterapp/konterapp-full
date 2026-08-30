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
 * Tabel saldo akun per cabang + input "jumlah aktual" (opsional, dipakai
 * hitung Selisih di backend) -- dipakai bareng saat buka & tutup shift, di
 * /app/pos (layar Kasir) maupun /app/pos/shifts (menu Shift Kasir), supaya
 * kedua form konsisten. Kolom dibatasi 3 (bukan 4) & pakai table-fixed
 * dengan lebar persen supaya MUAT di container sempit (mis. modal/kartu
 * max-w-md) tanpa perlu scroll horizontal -- saldo sistem dilipat jadi
 * sub-teks di bawah nama akun, bukan kolom sendiri.
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
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-[38%]" />
            <col className="w-[40%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr>
              <th className="border-b border-gray-200 py-2 pr-1 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Akun
              </th>
              <th className="border-b border-gray-200 py-2 px-1 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Aktual
              </th>
              <th className="border-b border-gray-200 py-2 pl-1 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Selisih
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const key = item.group.uuid;
              const rawActual = actualBalances[key] ?? '';
              const actualNumber = rawActual.trim() === '' ? null : Number(rawActual);
              const variance = actualNumber !== null && !Number.isNaN(actualNumber) ? actualNumber - item.group.balance : null;
              const varianceStyle =
                variance === null
                  ? 'text-gray-300'
                  : variance === 0
                    ? 'text-gray-500'
                    : variance > 0
                      ? 'text-green-600'
                      : 'text-red-600';

              return (
                <tr key={`${item.account.uuid}-${item.group.uuid}`} className="align-top">
                  <td className="border-b border-gray-100 py-2.5 pr-1">
                    <p className="font-medium text-gray-800 truncate">{item.account.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      Sistem {formatCurrency(item.group.balance)}
                      {item.group.name ? ` · ${item.group.name}` : ''}
                    </p>
                  </td>
                  <td className="border-b border-gray-100 py-2.5 px-1">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                      <input
                        type="number"
                        value={rawActual}
                        onChange={(e) => onActualBalanceChange(key, e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-7 pr-1.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                      />
                    </div>
                  </td>
                  <td className={`border-b border-gray-100 py-2.5 pl-1 text-right text-xs font-semibold ${varianceStyle}`}>
                    {variance === null ? '-' : `${variance > 0 ? '+' : ''}${formatCurrency(variance)}`}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td className="pt-2.5 text-sm font-semibold text-gray-700">Total</td>
              <td colSpan={2} className="pt-2.5 text-right text-sm font-bold text-[#142D52]">
                {formatCurrency(totalBalance)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
