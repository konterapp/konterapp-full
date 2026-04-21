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

  aggregateSales(where: Prisma.PosSaleWhereInput) {
    return prisma.posSale.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        discountAmount: true,
      },
    });
  },

  groupSalesByPaymentStatus(where: Prisma.PosSaleWhereInput) {
    return prisma.posSale.groupBy({
      by: ['paymentStatus'],
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
      orderBy: { paymentStatus: 'asc' },
    });
  },

  groupSalesByDate(where: Prisma.PosSaleWhereInput) {
    return prisma.posSale.groupBy({
      by: ['saleDate'],
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
      },
      orderBy: { saleDate: 'asc' },
    });
  },

  findRecentSales(where: Prisma.PosSaleWhereInput, take = 10) {
    return prisma.posSale.findMany({
      where,
      take,
      orderBy: { saleDate: 'desc' },
      select: {
        uuid: true,
        saleNumber: true,
        saleDate: true,
        totalAmount: true,
        paidAmount: true,
        paymentStatus: true,
        branch: {
          select: {
            uuid: true,
            name: true,
            code: true,
          },
        },
        customer: {
          select: {
            uuid: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  },

  aggregatePurchases(where: Prisma.PosPurchaseWhereInput) {
    return prisma.posPurchase.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        discountAmount: true,
      },
    });
  },

  groupPurchasesByPaymentStatus(where: Prisma.PosPurchaseWhereInput) {
    return prisma.posPurchase.groupBy({
      by: ['paymentStatus'],
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
      orderBy: { paymentStatus: 'asc' },
    });
  },

  groupPurchasesByDate(where: Prisma.PosPurchaseWhereInput) {
    return prisma.posPurchase.groupBy({
      by: ['purchaseDate'],
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
      },
      orderBy: { purchaseDate: 'asc' },
    });
  },

  findRecentPurchases(where: Prisma.PosPurchaseWhereInput, take = 10) {
    return prisma.posPurchase.findMany({
      where,
      take,
      orderBy: { purchaseDate: 'desc' },
      select: {
        uuid: true,
        purchaseNumber: true,
        purchaseDate: true,
        totalAmount: true,
        paidAmount: true,
        paymentStatus: true,
        branch: {
          select: {
            uuid: true,
            name: true,
            code: true,
          },
        },
        supplier: {
          select: {
            uuid: true,
            name: true,
            code: true,
          },
        },
      },
    });
  },
};
