type SnapshotRow = {
  phase: string;
  balance: unknown;
  actualBalance: unknown;
  variance: unknown;
  saldoAccount: {
    uuid: string;
    code: string;
    name: string;
    type: string;
    showInShift: boolean;
  } | null;
  saldoAccountBalance: {
    uuid: string;
    name: string | null;
  } | null;
};

type ShiftRow = {
  uuid: string;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
  totalSales: unknown;
  notesOpen: string | null;
  notesClose: string | null;
  saldoSnapshots?: SnapshotRow[];
  createdAt: Date;
  updatedAt: Date;
  branch: {
    uuid: string;
    name: string;
    code: string;
  } | null;
  user: {
    id: number;
    uuid: string;
    name: string;
    email: string;
  } | null;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

/**
 * Rakit baris snapshot 1 fase (opening/closing) jadi bentuk yg dipakai
 * frontend. `revealHidden = false` (viewer tanpa pos.saldo.view-real-balance,
 * default Kasir) -- akun show_in_shift=false di-null-kan balance/variance-nya
 * (barisnya tetap ada, cuma angkanya disembunyikan) & tidak ikut dihitung ke
 * total_balance/total_variance supaya tidak bisa ditebak via pengurangan.
 */
function buildSaldoSnapshotGroup(rows: SnapshotRow[] | undefined, phase: string, revealHidden: boolean) {
  const filtered = (rows || []).filter((row) => row.phase === phase);
  if (filtered.length === 0) return null;

  let totalBalance = 0;
  let totalVariance = 0;
  let hasAnyActual = false;

  const data = filtered.map((row) => {
    const isHidden = !revealHidden && row.saldoAccount?.showInShift === false;
    const balance = isHidden ? null : toNumber(row.balance);
    const actualBalance = toNullableNumber(row.actualBalance);
    const variance = isHidden ? null : toNullableNumber(row.variance);

    if (balance !== null) totalBalance += balance;
    if (variance !== null && actualBalance !== null) {
      hasAnyActual = true;
      totalVariance += variance;
    }

    return {
      account: row.saldoAccount
        ? {
            uuid: row.saldoAccount.uuid,
            code: row.saldoAccount.code,
            name: row.saldoAccount.name,
            type: row.saldoAccount.type,
          }
        : null,
      group: {
        uuid: row.saldoAccountBalance?.uuid ?? '',
        name: row.saldoAccountBalance?.name ?? null,
        balance,
        account_number: null,
        account_name: null,
      },
      actual_balance: actualBalance,
      variance,
    };
  });

  return {
    data,
    total_balance: Number(totalBalance.toFixed(2)),
    total_variance: hasAnyActual ? Number(totalVariance.toFixed(2)) : null,
  };
}

export function mapShift(shift: ShiftRow, revealHidden: boolean = true) {
  return {
    uuid: shift.uuid,
    status: shift.status,
    opened_at: shift.openedAt,
    closed_at: shift.closedAt,
    total_sales: toNumber(shift.totalSales),
    notes_open: shift.notesOpen,
    notes_close: shift.notesClose,
    opening_saldo: buildSaldoSnapshotGroup(shift.saldoSnapshots, 'opening', revealHidden),
    closing_saldo: buildSaldoSnapshotGroup(shift.saldoSnapshots, 'closing', revealHidden),
    created_at: shift.createdAt,
    updated_at: shift.updatedAt,
    branch: shift.branch
      ? {
          uuid: shift.branch.uuid,
          name: shift.branch.name,
          code: shift.branch.code,
        }
      : null,
    user: shift.user
      ? {
          id: shift.user.id,
          uuid: shift.user.uuid,
          name: shift.user.name,
          email: shift.user.email,
        }
      : null,
  };
}

export function mapActiveShiftWithLiveTotals(
  shift: ShiftRow,
  params: { currentTotalSales: number },
  revealHidden: boolean = true
) {
  const mapped = mapShift(shift, revealHidden);
  return {
    ...mapped,
    current_total_sales: params.currentTotalSales,
  };
}
