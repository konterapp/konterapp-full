import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const posReportRepository = {
  countSales(where: Prisma.PosSaleWhereInput) {
    return prisma.posSale.count({ where });
  },

  groupSoldProducts(saleWhere: Prisma.PosSaleWhereInput) {
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

  groupPurchaseCostRows(params: {
    purchaseWhere: Prisma.PosPurchaseWhereInput;
    productUuids: string[];
  }) {
    const { purchaseWhere, productUuids } = params;
    if (productUuids.length === 0) return Promise.resolve([]);

    return prisma.posPurchaseItem.groupBy({
      by: ['productUuid'],
      where: {
        productUuid: { in: productUuids },
        purchase: purchaseWhere,
      },
      _sum: {
        quantityBase: true,
        subtotal: true,
      },
    });
  },

  findProductsByUuids(productUuids: string[]) {
    if (productUuids.length === 0) return Promise.resolve([]);

    return prisma.posProduct.findMany({
      where: { uuid: { in: productUuids } },
      select: { uuid: true, name: true, sku: true, purchasePrice: true },
    });
  },

  findBranch(uuid: string) {
    return prisma.posBranch.findFirst({
      where: { uuid },
      select: { uuid: true, name: true },
    });
  },
};
