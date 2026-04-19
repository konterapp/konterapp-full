import { posStockOnHandRepository } from './repository';
import { mapStockOnHandListItem } from './stock-on-hand.mapper';
import { Prisma } from '@prisma/client';

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
  }) {
    const { page, perPage, search, branchUuid, categoryUuid, stockStatus, sortBy, sortOrder } = params;
    const skip = (page - 1) * perPage;
    const where: Prisma.PosProductStockWhereInput = {
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
      where.product = {
        ...(where.product || {}),
        categoryUuid,
      };
    }

    if (stockStatus === 'in_stock') {
      where.stock = { gt: 0 };
    } else if (stockStatus === 'out_stock') {
      where.stock = { lte: 0 };
    }

    const sortMap: Record<string, Prisma.PosProductStockOrderByWithRelationInput> = {
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
      posStockOnHandRepository.listBranches(),
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
