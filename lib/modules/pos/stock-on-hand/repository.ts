import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const posStockOnHandRepository = {
  findMany(params: {
    where: Prisma.AppPosProductStockWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.AppPosProductStockOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosProductStock.findMany({
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

  count(where: Prisma.AppPosProductStockWhereInput) {
    return prisma.appPosProductStock.count({ where });
  },

  listBranches() {
    return prisma.appPosBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  listCategories() {
    return prisma.appPosProductCategory.findMany({
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },
};
