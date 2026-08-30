import type { Prisma } from '@prisma/client';
import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posBranchRepository } from './repository';
import { mapBranch, mapBranchListSimple } from './branch.mapper';
import { assertBranchLimit } from '@/lib/modules/billing/plan-limits';
import { posSaldoRepository } from '@/lib/modules/pos/saldo/repository';
import { mapBranchSaldoLink } from '@/lib/modules/pos/saldo/saldo.mapper';
import { appUserRepository } from '@/lib/modules/users/app.repository';

export const posBranchService = {
  async listBranches(params: {
    page: number;
    perPage: number;
    search: string;
    isActive: string | null;
  }) {
    const { page, perPage, search, isActive } = params;
    const skip = (page - 1) * perPage;
    const where: Prisma.AppPosBranchWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [branches, total] = await Promise.all([
      posBranchRepository.findMany({ where, skip, take: perPage }),
      posBranchRepository.count(where),
    ]);

    return {
      data: branches.map(mapBranch),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async listBranchesSimple() {
    const branches = await posBranchRepository.listSimple();
    return branches.map(mapBranchListSimple);
  },

  /**
   * Untuk dropdown filter cabang di halaman-halaman yang tidak khusus
   * mengelola cabang (transaksi, laporan, stock movement, produk, ppob) --
   * boleh diakses role apa pun (tidak perlu permission pos.branch.index),
   * tapi hasilnya difilter ke cabang yang di-assign ke user kalau role-nya
   * dibatasi (lihat CompanyUserBranch). User tanpa pembatasan (assignment
   * kosong) tetap lihat semua cabang aktif seperti biasa.
   */
  async listBranchOptions(companyUuid: string, userId: number) {
    const [branches, assignedBranchUuids] = await Promise.all([
      posBranchRepository.listSimple(),
      appUserRepository.getAssignedBranchUuids(companyUuid, userId),
    ]);

    const active = branches.filter((b) => b.isActive);
    const scoped =
      assignedBranchUuids.length > 0
        ? active.filter((b) => assignedBranchUuids.includes(b.uuid))
        : active;

    return scoped.map(mapBranchListSimple);
  },

  async getBranchDetail(uuid: string) {
    const branch = await posBranchRepository.findByUuid(uuid);
    if (!branch) {
      throw new ApiError('Branch not found', 404);
    }

    return mapBranch(branch);
  },

  async getBranchSaldo(uuid: string, options?: { onlyShowInShift?: boolean }) {
    const branch = await posBranchRepository.findByUuid(uuid);
    if (!branch) {
      throw new ApiError('Branch not found', 404);
    }

    const links = await posSaldoRepository.findLinksForBranchWithDetails(uuid, options);
    const items = links.map(mapBranchSaldoLink);
    const totalBalance = items.reduce((sum, item) => sum + item.group.balance, 0);

    return {
      branch: mapBranch(branch),
      data: items,
      total_balance: Number(totalBalance.toFixed(2)),
    };
  },

  async createBranch(
    companyUuid: string,
    payload: {
      code: string;
      name: string;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
      isActive?: boolean;
      isMain?: boolean;
      maxConcurrentUsers?: number;
    }
  ) {
    const existing = await posBranchRepository.findByCode(companyUuid, payload.code);
    if (existing) {
      throw new ValidationApiError({ code: ['Kode cabang sudah digunakan'] });
    }

    const branchCount = await posBranchRepository.count({ companyUuid });
    await assertBranchLimit(companyUuid, branchCount);

    return posBranchRepository.runInTransaction(async (tx) => {
      if (payload.isMain) {
        await posBranchRepository.unsetOtherMainBranches(undefined, tx);
      }

      const branch = await posBranchRepository.create(
        {
          companyUuid,
          code: payload.code,
          name: payload.name,
          address: payload.address || null,
          phone: payload.phone || null,
          email: payload.email || null,
          isActive: payload.isActive ?? true,
          isMain: payload.isMain ?? false,
          maxConcurrentUsers: payload.maxConcurrentUsers ?? 1,
        },
        tx
      );

      // Cabang baru otomatis dapat grup balance SENDIRI & TERPISAH (saldo 0)
      // untuk setiap akun saldo aktif yang ada di company ini -- bukan ikut
      // nimbrung ke grup cabang lain (itu berarti berbagi uang beneran).
      // Kalau memang mau berbagi saldo dengan cabang lain, itu dilakukan
      // eksplisit lewat "Tambah/Edit Grup Balance" di halaman detail akun
      // saldo, bukan otomatis saat bikin cabang baru.
      const saldoAccounts = await posSaldoRepository.listActiveAccountUuids(companyUuid, tx);
      for (const account of saldoAccounts) {
        await posSaldoRepository.createBalanceGroupInTx(tx, {
          companyUuid,
          saldoAccountUuid: account.uuid,
          balance: 0,
          branchUuids: [branch.uuid],
        });
      }

      return mapBranch(branch);
    });
  },

  async updateBranch(
    uuid: string,
    companyUuid: string,
    payload: {
      code?: string;
      name?: string;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
      isActive?: boolean;
      isMain?: boolean;
      maxConcurrentUsers?: number;
    }
  ) {
    const existing = await posBranchRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Branch not found', 404);
    }

    if (payload.code && payload.code !== existing.code) {
      const codeExists = await posBranchRepository.findByCode(companyUuid, payload.code);
      if (codeExists) {
        throw new ValidationApiError({ code: ['Kode cabang sudah digunakan'] });
      }
    }

    if (payload.isMain && !existing.isMain) {
      await posBranchRepository.unsetOtherMainBranches(uuid);
    }

    const branch = await posBranchRepository.updateByUuid(uuid, {
      code: payload.code || existing.code,
      name: payload.name || existing.name,
      address: payload.address ?? existing.address,
      phone: payload.phone ?? existing.phone,
      email: payload.email ?? existing.email,
      isActive: payload.isActive ?? existing.isActive,
      isMain: payload.isMain ?? existing.isMain,
      maxConcurrentUsers: payload.maxConcurrentUsers ?? existing.maxConcurrentUsers,
    });
    return mapBranch(branch);
  },

  async deleteBranch(uuid: string) {
    const existing = await posBranchRepository.findByUuid(uuid);
    if (!existing) {
      throw new ApiError('Branch not found', 404);
    }

    const [salesCount, purchasesCount, stockCount] = await posBranchRepository.countDependencies(uuid);
    if (salesCount > 0 || purchasesCount > 0 || stockCount > 0) {
      throw new ApiError('Cannot delete branch with existing transactions or stock', 400);
    }

    await posBranchRepository.deleteByUuid(uuid);
  },
};
