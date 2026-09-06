import { posStockOnHandRepository } from './repository';
import { mapStockOnHandListItem } from './stock-on-hand.mapper';
import { Prisma } from '@prisma/client';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';

export const posStockOnHandService = {
  async listStockOnHand(params: {
    page: number;
    perPage: number;
    search: string;
    branchUuid: string;
    categoryUuid: string;
    stockStatus: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    companyUuid: string;
    userId: number;
  }) {
    const { page, perPage, search, branchUuid, categoryUuid, stockStatus, sortBy, sortOrder, companyUuid, userId } = params;
    const skip = (page - 1) * perPage;
    const where: Prisma.AppPosProductStockWhereInput = {
      product: {
        isActive: true,
      },
    };

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { product: { barcode: { contains: search, mode: 'insensitive' } } },
        { branch: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (branchUuid) where.branchUuid = branchUuid;
    if (categoryUuid) {
      // where.product bertipe union (relation filter | where input); di-anotasi
      // eksplisit dulu supaya spread-nya tidak ter-narrow jadi `undefined`.
      const productFilter: Prisma.AppPosProductWhereInput = {
        ...(where.product as Prisma.AppPosProductWhereInput | undefined),
        categoryUuid,
      };
      where.product = productFilter;
    }

    if (stockStatus === 'in_stock') {
      where.stock = { gt: 0 };
    } else if (stockStatus === 'out_stock') {
      where.stock = { lte: 0 };
    }

    const sortMap: Record<string, Prisma.AppPosProductStockOrderByWithRelationInput> = {
      product_name: { product: { name: sortOrder } },
      branch_name: { branch: { name: sortOrder } },
      stock: { stock: sortOrder },
      min_stock: { product: { minStock: sortOrder } },
      updated_at: { updatedAt: sortOrder },
    };
    const orderBy = sortMap[sortBy] || sortMap.product_name;

    const [rows, total, branches, categories] = await Promise.all([
      posStockOnHandRepository.findMany({ where, skip, take: perPage, orderBy }),
      posStockOnHandRepository.count(where),
      posBranchService.listBranchOptions(companyUuid, userId),
      posStockOnHandRepository.listCategories(),
    ]);

    return {
      data: rows.map(mapStockOnHandListItem),
      filters: {
        branches,
        categories,
      },
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },
};
