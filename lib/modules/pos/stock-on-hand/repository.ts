import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const posStockOnHandRepository = {
  findMany(params: {
    where: Prisma.PosProductStockWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.PosProductStockOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posProductStock.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        product: {
          select: {
            uuid: true,
            name: true,
            sku: true,
            barcode: true,
            minStock: true,
            unit: true,
            isActive: true,
            category: {
              select: {
                uuid: true,
                name: true,
              },
            },
          },
        },
        branch: {
          select: {
            uuid: true,
            code: true,
            name: true,
          },
        },
      },
    });
  },

  count(where: Prisma.PosProductStockWhereInput) {
    return prisma.posProductStock.count({ where });
  },

  listBranches() {
    return prisma.posBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  listCategories() {
    return prisma.posProductCategory.findMany({
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },
};
