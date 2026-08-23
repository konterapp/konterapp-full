import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const payablePurchaseInclude = {
  branch: {
    select: { uuid: true, name: true, code: true },
  },
  supplier: {
    select: { uuid: true, name: true, code: true, phone: true },
  },
  creator: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.AppPosPurchaseInclude;

export type PayablePurchaseRow = Prisma.AppPosPurchaseGetPayload<{
  include: typeof payablePurchaseInclude;
}>;

export const posPayableRepository = {
  findMany(params: {
    where: Prisma.AppPosPurchaseWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.AppPosPurchaseOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosPurchase.findMany({
      where,
      skip,
      take,
      orderBy,
      include: payablePurchaseInclude,
    });
  },

  count(where: Prisma.AppPosPurchaseWhereInput) {
    return prisma.appPosPurchase.count({ where });
  },

  aggregateAmounts(where: Prisma.AppPosPurchaseWhereInput) {
    return prisma.appPosPurchase.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });
  },

  async countDistinctSuppliers(where: Prisma.AppPosPurchaseWhereInput) {
    const rows = await prisma.appPosPurchase.findMany({
      where,
      distinct: ['supplierUuid'],
      select: { supplierUuid: true },
    });

    return rows.length;
  },

  listSuppliers() {
    return prisma.appPosSupplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  findByUuid(uuid: string) {
    return prisma.appPosPurchase.findFirst({
      where: { uuid },
      include: payablePurchaseInclude,
    });
  },

  updatePayment(params: {
    uuid: string;
    paidAmount: number;
    paymentStatus: 'partial' | 'paid';
    notes: string | null;
  }) {
    const { uuid, paidAmount, paymentStatus, notes } = params;
    return prisma.appPosPurchase.update({
      where: { uuid },
      data: {
        paidAmount,
        paymentStatus,
        notes,
      },
      include: payablePurchaseInclude,
    });
  },
};
