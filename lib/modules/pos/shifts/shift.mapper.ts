type ShiftRow = {
  uuid: string;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
  openingCash: unknown;
  totalSales: unknown;
  expectedCash: unknown;
  closingCash: unknown;
  variance: unknown;
  notesOpen: string | null;
  notesClose: string | null;
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

export function mapShift(shift: ShiftRow) {
  return {
    uuid: shift.uuid,
    status: shift.status,
    opened_at: shift.openedAt,
    closed_at: shift.closedAt,
    opening_cash: toNumber(shift.openingCash),
    total_sales: toNumber(shift.totalSales),
    expected_cash: toNumber(shift.expectedCash),
    closing_cash: shift.closingCash === null ? null : toNumber(shift.closingCash),
    variance: toNumber(shift.variance),
    notes_open: shift.notesOpen,
    notes_close: shift.notesClose,
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
  params: { currentTotalSales: number; currentExpectedCash: number }
) {
  const mapped = mapShift(shift);
  return {
    ...mapped,
    current_total_sales: params.currentTotalSales,
    current_expected_cash: params.currentExpectedCash,
  };
}
