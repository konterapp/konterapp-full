import { ApiError } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';
import { posShiftRepository } from './repository';
import { mapActiveShiftWithLiveTotals, mapShift } from './shift.mapper';
import { appUserRepository } from '@/lib/modules/users/app.repository';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';
import { getUserPermissions, hasPermission } from '@/lib/permissions';

const VIEW_REAL_BALANCE_PERMISSION = 'pos.saldo.view-real-balance';

async function canRevealRealBalance(userId: number, companyUuid: string) {
  const permissions = await getUserPermissions(userId, companyUuid);
  return hasPermission(permissions, VIEW_REAL_BALANCE_PERMISSION);
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  return Number(value);
}

interface SaldoLinkItem {
  account: { uuid: string };
  // Nullable krn tipe balik getBranchSaldo dukung masking -- di titik
  // pemakaian fungsi ini SELALU dipanggil dgn revealHidden: true (nilai
  // asli utk disimpan), jadi null cuma teoretis, ditangani via `?? 0`.
  group: { uuid: string; balance: number | null };
}

/**
 * Gabungkan saldo sistem (hasil getBranchSaldo) dengan input "hasil hitung/
 * cek fisik" kasir (actualBalances, keyed by saldo_account_balance_uuid) --
 * berlaku utk akun apa pun (tunai, e-wallet, bank), bukan cuma tipe cash,
 * krn tujuan awal Saldo memang "dicocokkan dengan saldo asli di HP/dompet".
 * Opsional per akun -- kasir boleh skip akun yg tidak dicek, sisanya tetap
 * null (tidak dianggap selisih 0). Hasilnya baris siap-insert ke tabel
 * app_pos_cashier_shift_saldo_snapshots (1 baris = 1 akun per fase).
 */
function buildSaldoSnapshotRows(params: {
  companyUuid: string;
  shiftUuid: string;
  phase: 'opening' | 'closing';
  saldo: { data: SaldoLinkItem[] };
  actualBalances: Record<string, number> | undefined;
}): Prisma.AppPosCashierShiftSaldoSnapshotUncheckedCreateInput[] {
  const { companyUuid, shiftUuid, phase, saldo, actualBalances } = params;

  return saldo.data.map((item) => {
    const balance = item.group.balance ?? 0;
    const rawActual = actualBalances?.[item.group.uuid];
    const hasActual = typeof rawActual === 'number' && !Number.isNaN(rawActual);
    const variance = hasActual ? Number((rawActual - balance).toFixed(2)) : null;

    return {
      companyUuid,
      shiftUuid,
      phase,
      saldoAccountUuid: item.account.uuid,
      saldoAccountBalanceUuid: item.group.uuid,
      balance,
      actualBalance: hasActual ? rawActual : null,
      variance,
    };
  });
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
    companyUuid: string;
  }) {
    const { page, perPage, search, branchUuid, status, sortBy, sortOrder, userId, companyUuid } = params;
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

    const [rows, total, branchOptions, openCounts, activeShift, canReveal] = await Promise.all([
      posShiftRepository.findMany({ where, skip, take: perPage, orderBy }),
      posShiftRepository.count(where),
      posBranchService.listBranchOptions(companyUuid, userId),
      posShiftRepository.countOpenGroupedByBranch(),
      posShiftRepository.findOpenByUser(userId),
      canRevealRealBalance(userId, companyUuid),
    ]);

    const openCountByBranch = new Map(openCounts.map((row) => [row.branchUuid, row._count._all]));
    const branches = branchOptions.map((branch) => ({
      ...branch,
      open_shift_count: openCountByBranch.get(branch.uuid) || 0,
    }));

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

      activeShiftMapped = mapActiveShiftWithLiveTotals(activeShift, { currentTotalSales }, canReveal);
    }

    return {
      data: rows.map((row) => mapShift(row, canReveal)),
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
      actualBalances?: Record<string, number>;
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

    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(branch.companyUuid, userId);
    if (assignedBranchUuids.length > 0 && !assignedBranchUuids.includes(payload.branchUuid)) {
      throw new ApiError('Anda tidak punya akses ke cabang ini', 403);
    }

    const openCount = await posShiftRepository.countOpenByBranch(payload.branchUuid);
    if (openCount >= branch.maxConcurrentUsers) {
      throw new ApiError(
        `Cabang ini sudah mencapai batas maksimal kasir aktif (${branch.maxConcurrentUsers})`,
        400
      );
    }

    // Snapshot saldo cabang PADA SAAT INI -- direkam sekali & disimpan
    // permanen di baris shift, bukan di-query ulang tiap kali riwayat shift
    // dibuka (kalau live, semua baris riwayat di cabang yang sama bakal
    // kelihatan sama persis, percuma buat rekonsiliasi per shift). Selalu
    // ambil nilai ASLI (revealHidden: true) -- masking utk kasir cuma
    // berlaku saat DITAMPILKAN (lihat mapShift di bawah), bukan saat
    // disimpan (histori tetap perlu akurat buat admin).
    const openingSaldo = await posBranchService.getBranchSaldo(payload.branchUuid, { revealHidden: true });
    const canReveal = await canRevealRealBalance(userId, branch.companyUuid);

    const shift = await posShiftRepository.runInTransaction(async (tx) => {
      const created = await posShiftRepository.createInTx(tx, {
        companyUuid: branch.companyUuid,
        branchUuid: payload.branchUuid,
        userId,
        status: 'open',
        openedAt: new Date(),
        totalSales: 0,
        notesOpen: payload.notesOpen?.trim() || null,
      });

      const snapshotRows = buildSaldoSnapshotRows({
        companyUuid: branch.companyUuid,
        shiftUuid: created.uuid,
        phase: 'opening',
        saldo: openingSaldo,
        actualBalances: payload.actualBalances,
      });
      await posShiftRepository.createSaldoSnapshotsInTx(tx, snapshotRows);

      return posShiftRepository.findByUuidInTx(tx, created.uuid);
    });

    return mapShift(shift, canReveal);
  },

  async closeShift(
    shiftUuid: string,
    payload: {
      notesClose?: string | null;
      actualBalances?: Record<string, number>;
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

    const closingSaldo = await posBranchService.getBranchSaldo(existing.branchUuid, { revealHidden: true });
    const canReveal = await canRevealRealBalance(userId, existing.companyUuid);

    const updated = await posShiftRepository.runInTransaction(async (tx) => {
      const closed = await posShiftRepository.updateByUuidInTx(tx, shiftUuid, {
        status: 'closed',
        closedAt: now,
        totalSales,
        notesClose: payload.notesClose?.trim() || null,
      });

      const snapshotRows = buildSaldoSnapshotRows({
        companyUuid: existing.companyUuid,
        shiftUuid,
        phase: 'closing',
        saldo: closingSaldo,
        actualBalances: payload.actualBalances,
      });
      await posShiftRepository.createSaldoSnapshotsInTx(tx, snapshotRows);

      return posShiftRepository.findByUuidInTx(tx, closed.uuid);
    });

    return mapShift(updated, canReveal);
  },

  async getBranchSaldoForShift(branchUuid: string, userId: number) {
    const branch = await posShiftRepository.findBranchByUuid(branchUuid);
    if (!branch) {
      throw new ApiError('Cabang tidak ditemukan atau tidak aktif', 404);
    }

    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(branch.companyUuid, userId);
    if (assignedBranchUuids.length > 0 && !assignedBranchUuids.includes(branchUuid)) {
      throw new ApiError('Anda tidak punya akses ke cabang ini', 403);
    }

    const canReveal = await canRevealRealBalance(userId, branch.companyUuid);
    return posBranchService.getBranchSaldo(branchUuid, { revealHidden: canReveal });
  },
};
