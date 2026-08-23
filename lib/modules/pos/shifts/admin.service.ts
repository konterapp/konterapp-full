import { ApiError } from '@/lib/api-errors';
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

    const where: Prisma.AppPosCashierShiftWhereInput = {};

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

    const sortMap: Record<string, Prisma.AppPosCashierShiftOrderByWithRelationInput> = {
      opened_at: { openedAt: sortOrder },
      closed_at: { closedAt: sortOrder },
      total_sales: { totalSales: sortOrder },
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

      activeShiftMapped = mapActiveShiftWithLiveTotals(activeShift, {
        currentTotalSales,
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
      notesOpen?: string | null;
    },
    userId: number
  ) {
    const existingOpen = await posShiftRepository.findOpenByUser(userId);
    if (existingOpen) {
      throw new ApiError('Masih ada shift aktif. Tutup shift aktif terlebih dahulu.', 400);
    }

    const branch = await posShiftRepository.findBranchByUuid(payload.branchUuid);
    if (!branch) {
      throw new ApiError('Cabang tidak ditemukan atau tidak aktif', 404);
    }

    const shift = await posShiftRepository.create({
      companyUuid: branch.companyUuid,
      branchUuid: payload.branchUuid,
      userId,
      status: 'open',
      openedAt: new Date(),
      totalSales: 0,
      notesOpen: payload.notesOpen?.trim() || null,
    });

    return mapShift(shift);
  },

  async closeShift(
    shiftUuid: string,
    payload: {
      notesClose?: string | null;
    },
    userId: number
  ) {
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

    const updated = await posShiftRepository.updateByUuid(shiftUuid, {
      status: 'closed',
      closedAt: now,
      totalSales,
      notesClose: payload.notesClose?.trim() || null,
    });

    return mapShift(updated);
  },
};
