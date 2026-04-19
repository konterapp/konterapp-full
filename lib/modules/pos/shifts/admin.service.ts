import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';
import { posShiftRepository } from './repository';
import { mapActiveShiftWithLiveTotals, mapShift } from './shift.mapper';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export const posShiftService = {
  async listShifts(params: {
    page: number;
    perPage: number;
    search: string;
    branchUuid: string;
    status: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    userId: number;
  }) {
    const { page, perPage, search, branchUuid, status, sortBy, sortOrder, userId } = params;
    const skip = (page - 1) * perPage;

    const where: Prisma.PosCashierShiftWhereInput = {};

    if (search) {
      where.OR = [
        { branch: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { notesOpen: { contains: search, mode: 'insensitive' } },
        { notesClose: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (branchUuid) where.branchUuid = branchUuid;
    if (status) where.status = status;

    const sortMap: Record<string, Prisma.PosCashierShiftOrderByWithRelationInput> = {
      opened_at: { openedAt: sortOrder },
      closed_at: { closedAt: sortOrder },
      opening_cash: { openingCash: sortOrder },
      total_sales: { totalSales: sortOrder },
      expected_cash: { expectedCash: sortOrder },
      variance: { variance: sortOrder },
      status: { status: sortOrder },
      created_at: { createdAt: sortOrder },
    };

    const orderBy = sortMap[sortBy] || sortMap.opened_at;

    const [rows, total, branches, activeShift] = await Promise.all([
      posShiftRepository.findMany({ where, skip, take: perPage, orderBy }),
      posShiftRepository.count(where),
      posShiftRepository.listBranches(),
      posShiftRepository.findOpenByUser(userId),
    ]);

    let activeShiftMapped: ReturnType<typeof mapActiveShiftWithLiveTotals> | null = null;

    if (activeShift) {
      const now = new Date();
      const salesAgg = await posShiftRepository.sumSales({
        branchUuid: activeShift.branchUuid,
        userId,
        startedAt: activeShift.openedAt,
        endedAt: now,
      });

      const currentTotalSales = toNumber(salesAgg._sum.totalAmount);
      const currentExpectedCash = toNumber(activeShift.openingCash) + currentTotalSales;

      activeShiftMapped = mapActiveShiftWithLiveTotals(activeShift, {
        currentTotalSales,
        currentExpectedCash,
      });
    }

    return {
      data: rows.map(mapShift),
      active_shift: activeShiftMapped,
      filters: {
        branches,
      },
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async openShift(
    payload: {
      branchUuid: string;
      openingCash: number;
      notesOpen?: string | null;
    },
    userId: number
  ) {
    if (payload.openingCash < 0) {
      throw new ValidationApiError({ opening_cash: ['Kas awal tidak boleh negatif'] });
    }

    const existingOpen = await posShiftRepository.findOpenByUser(userId);
    if (existingOpen) {
      throw new ApiError('Masih ada shift aktif. Tutup shift aktif terlebih dahulu.', 400);
    }

    const branch = await posShiftRepository.findBranchByUuid(payload.branchUuid);
    if (!branch) {
      throw new ApiError('Cabang tidak ditemukan atau tidak aktif', 404);
    }

    const openingCash = Number(payload.openingCash);

    const shift = await posShiftRepository.create({
      companyUuid: branch.companyUuid,
      branchUuid: payload.branchUuid,
      userId,
      status: 'open',
      openedAt: new Date(),
      openingCash,
      totalSales: 0,
      expectedCash: openingCash,
      variance: 0,
      notesOpen: payload.notesOpen?.trim() || null,
    });

    return mapShift(shift);
  },

  async closeShift(
    shiftUuid: string,
    payload: {
      closingCash: number;
      notesClose?: string | null;
    },
    userId: number
  ) {
    if (payload.closingCash < 0) {
      throw new ValidationApiError({ closing_cash: ['Kas akhir tidak boleh negatif'] });
    }

    const existing = await posShiftRepository.findByUuidForUser(shiftUuid, userId);
    if (!existing) {
      throw new ApiError('Shift tidak ditemukan', 404);
    }

    if (existing.status !== 'open') {
      throw new ApiError('Shift sudah ditutup', 400);
    }

    const now = new Date();
    const salesAgg = await posShiftRepository.sumSales({
      branchUuid: existing.branchUuid,
      userId,
      startedAt: existing.openedAt,
      endedAt: now,
    });

    const totalSales = toNumber(salesAgg._sum.totalAmount);
    const expectedCash = toNumber(existing.openingCash) + totalSales;
    const closingCash = Number(payload.closingCash);
    const variance = closingCash - expectedCash;

    const updated = await posShiftRepository.updateByUuid(shiftUuid, {
      status: 'closed',
      closedAt: now,
      totalSales,
      expectedCash,
      closingCash,
      variance,
      notesClose: payload.notesClose?.trim() || null,
    });

    return mapShift(updated);
  },
};
