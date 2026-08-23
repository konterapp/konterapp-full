import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { posBranchRepository } from './repository';
import { mapBranch, mapBranchListSimple } from './branch.mapper';
import { assertBranchLimit } from '@/lib/modules/billing/plan-limits';
import { posSaldoRepository } from '@/lib/modules/pos/saldo/repository';

export const posBranchService = {
  async listBranches(params: {
    page: number;
    perPage: number;
    search: string;
    isActive: string | null;
  }) {
    const { page, perPage, search, isActive } = params;
    const skip = (page - 1) * perPage;
    const where: any = {};

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

  async getBranchDetail(uuid: string) {
    const branch = await posBranchRepository.findByUuid(uuid);
    if (!branch) {
      throw new ApiError('Branch not found', 404);
    }

    return mapBranch(branch);
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
      copySaldoFromBranchUuid?: string | null;
    }
  ) {
    const existing = await posBranchRepository.findByCode(companyUuid, payload.code);
    if (existing) {
      throw new ValidationApiError({ code: ['Kode cabang sudah digunakan'] });
    }

    const branchCount = await posBranchRepository.count({ companyUuid });
    await assertBranchLimit(companyUuid, branchCount);

    // Opsi "copy pengaturan saldo dari cabang lain": cabang baru otomatis
    // masuk ke grup-grup balance yang sama dengan cabang sumber. Kalau tidak
    // dipilih, cabang baru belum punya akun saldo apa pun sampai di-assign
    // manual lewat halaman detail akun saldo.
    let sourceBranch: { uuid: string } | null = null;
    if (payload.copySaldoFromBranchUuid) {
      sourceBranch = await posBranchRepository.findByUuid(payload.copySaldoFromBranchUuid);
      if (!sourceBranch) {
        throw new ValidationApiError({ copy_saldo_from_branch_uuid: ['Cabang sumber tidak ditemukan'] });
      }
    }

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
        },
        tx
      );

      if (sourceBranch) {
        const sourceLinks = await posSaldoRepository.findLinksOfBranch(sourceBranch.uuid, tx);
        if (sourceLinks.length > 0) {
          await tx.appPosSaldoAccountBalanceBranch.createMany({
            data: sourceLinks.map((link) => ({
              companyUuid,
              saldoAccountUuid: link.saldoAccountUuid,
              saldoAccountBalanceUuid: link.saldoAccountBalanceUuid,
              branchUuid: branch.uuid,
            })),
          });
        }
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
