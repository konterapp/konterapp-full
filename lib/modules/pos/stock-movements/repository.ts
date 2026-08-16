import { prisma } from '@/lib/prisma';

export const posStockMovementRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosStockMovement.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        product: { select: { uuid: true, name: true, sku: true } },
        branch: { select: { uuid: true, name: true } },
      },
    });
  },

  count(where: any) {
    return prisma.appPosStockMovement.count({ where });
  },
};
