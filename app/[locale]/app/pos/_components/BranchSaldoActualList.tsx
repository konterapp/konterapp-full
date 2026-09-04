'use client';

import type { BranchSaldoItem } from '@/lib/api/app/branch';
import RupiahInput from '@/components/ui/RupiahInput';

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
function computeRow(item: BranchSaldoItem, actualBalances: Record<string, string>) {
  const key = item.group.uuid;
  const rawActual = actualBalances[key] ?? '';
  const actualNumber = rawActual.trim() === '' ? null : Number(rawActual);
  const isHidden = item.group.balance === null;
  const variance =
    !isHidden && actualNumber !== null && !Number.isNaN(actualNumber)
      ? actualNumber - (item.group.balance as number)
      : null;
  const varianceStyle =
    variance === null
      ? 'text-gray-300'
      : variance === 0
        ? 'text-gray-500'
        : variance > 0
          ? 'text-green-600'
          : 'text-red-600';
  const varianceText = isHidden
    ? '\u2022\u2022\u2022'
    : variance === null
      ? '-'
      : `${variance > 0 ? '+' : ''}${formatCurrency(variance)}`;
  const systemText = isHidden
    ? 'Sistem disembunyikan'
    : `Sistem ${formatCurrency(item.group.balance as number)}`;

  return { key, rawActual, isHidden, varianceStyle, varianceText, systemText };
}

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
        <>
        {/* Layar kecil: tiap akun ditumpuk jadi satu blok. Sebagai tabel 3
            kolom di lebar 390px, kolom Akun cuma ~120px sehingga nilai
            "Sistem Rp ..." terpangkas jadi "Sistem Rp 934.9..." dan kolom
            Selisih tergencet tinggal "-". Tabelnya sendiri tidak diubah dan
            tetap dipakai mulai sm, jadi tampilan desktop persis seperti
            semula (komponen ini dipakai juga oleh layar Kasir). */}
        <div className="space-y-3 sm:hidden">
          {items.map((item) => {
            const { key, rawActual, varianceStyle, varianceText, systemText } = computeRow(item, actualBalances);

            return (
              <div key={`${item.account.uuid}-${item.group.uuid}`} className="rounded-lg border border-gray-100 p-3">
                {/* Selisih ditaruh di kanan atas sebaris dgn nama akun, bukan
                    di samping input: kalau bersebelahan, label "Aktual" dan
                    "Selisih" tidak pernah sejajar karena tinggi keduanya beda
                    (input vs teks biasa). */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{item.account.name}</p>
                    <p className="text-xs text-gray-400">
                      {systemText}
                      {item.group.name ? ` · ${item.group.name}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Selisih</p>
                    <p className={`text-sm font-semibold ${varianceStyle}`}>{varianceText}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Aktual</p>
                  <RupiahInput value={rawActual} onChange={(v) => onActualBalanceChange(key, v)} />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-sm font-bold text-[#142D52]">{formatCurrency(totalBalance)}</span>
          </div>
          {items.some((item) => item.group.balance === null) && (
            <p className="text-right text-[11px] italic text-gray-400">
              Total belum termasuk akun yang disembunyikan
            </p>
          )}
        </div>

        <table className="hidden sm:table w-full table-fixed border-separate border-spacing-0 text-sm">
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
              const { key, rawActual, varianceStyle, varianceText, systemText } = computeRow(item, actualBalances);

              return (
                <tr key={`${item.account.uuid}-${item.group.uuid}`} className="align-top">
                  <td className="border-b border-gray-100 py-2.5 pr-1">
                    <p className="font-medium text-gray-800 truncate">{item.account.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {systemText}
                      {item.group.name ? ` · ${item.group.name}` : ''}
                    </p>
                  </td>
                  <td className="border-b border-gray-100 py-2.5 px-1">
                    <RupiahInput
                      size="compact"
                      value={rawActual}
                      onChange={(v) => onActualBalanceChange(key, v)}
                    />
                  </td>
                  <td className={`border-b border-gray-100 py-2.5 pl-1 text-right text-xs font-semibold ${varianceStyle}`}>
                    {varianceText}
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
            {items.some((item) => item.group.balance === null) && (
              <tr>
                <td colSpan={3} className="pt-1 text-right text-[11px] italic text-gray-400">
                  Total belum termasuk akun yang disembunyikan
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}
