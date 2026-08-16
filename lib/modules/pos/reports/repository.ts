import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const posReportRepository = {
  countSales(where: Prisma.AppPosSaleWhereInput) {
    return prisma.appPosSale.count({ where });
  },

  groupSoldProducts(saleWhere: Prisma.AppPosSaleWhereInput) {
    return prisma.appPosSaleItem.groupBy({
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
    purchaseWhere: Prisma.AppPosPurchaseWhereInput;
    productUuids: string[];
  }) {
    const { purchaseWhere, productUuids } = params;
    if (productUuids.length === 0) return Promise.resolve([]);

    return prisma.appPosPurchaseItem.groupBy({
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

    return prisma.appPosProduct.findMany({
      where: { uuid: { in: productUuids } },
      select: { uuid: true, name: true, sku: true, purchasePrice: true },
    });
  },

  findBranch(uuid: string) {
    return prisma.appPosBranch.findFirst({
      where: { uuid },
      select: { uuid: true, name: true },
    });
  },

  aggregateSales(where: Prisma.AppPosSaleWhereInput) {
    return prisma.appPosSale.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        discountAmount: true,
      },
    });
  },

  groupSalesByPaymentStatus(where: Prisma.AppPosSaleWhereInput) {
    return prisma.appPosSale.groupBy({
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

  groupSalesByDate(where: Prisma.AppPosSaleWhereInput) {
    return prisma.appPosSale.groupBy({
      by: ['saleDate'],
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
      },
      orderBy: { saleDate: 'asc' },
    });
  },

  findRecentSales(where: Prisma.AppPosSaleWhereInput, take = 10) {
    return prisma.appPosSale.findMany({
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

  aggregatePurchases(where: Prisma.AppPosPurchaseWhereInput) {
    return prisma.appPosPurchase.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        discountAmount: true,
      },
    });
  },

  groupPurchasesByPaymentStatus(where: Prisma.AppPosPurchaseWhereInput) {
    return prisma.appPosPurchase.groupBy({
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

  groupPurchasesByDate(where: Prisma.AppPosPurchaseWhereInput) {
    return prisma.appPosPurchase.groupBy({
      by: ['purchaseDate'],
      where,
      _count: { _all: true },
      _sum: {
        totalAmount: true,
      },
      orderBy: { purchaseDate: 'asc' },
    });
  },

  findRecentPurchases(where: Prisma.AppPosPurchaseWhereInput, take = 10) {
    return prisma.appPosPurchase.findMany({
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
