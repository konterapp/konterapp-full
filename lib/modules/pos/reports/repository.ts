import { prisma } from '@/lib/prisma';

export const posReportRepository = {
  countSales(where: any) {
    return prisma.posSale.count({ where });
  },

  groupSoldProducts(saleWhere: any) {
    return prisma.posSaleItem.groupBy({
      by: ['productUuid'],
      where: {
        sale: saleWhere,
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
    });
  },

  groupPurchaseAverageRows() {
    return prisma.posPurchaseItem.groupBy({
      by: ['productUuid'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
    });
  },

  findProductsByUuids(productUuids: string[]) {
    if (productUuids.length === 0) return Promise.resolve([]);

    return prisma.posProduct.findMany({
      where: { uuid: { in: productUuids } },
      select: { uuid: true, name: true, sku: true },
    });
  },

  findBranch(uuid: string) {
    return prisma.posBranch.findFirst({
      where: { uuid },
      select: { uuid: true, name: true },
    });
  },
};
