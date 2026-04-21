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
} satisfies Prisma.PosPurchaseInclude;

export type PayablePurchaseRow = Prisma.PosPurchaseGetPayload<{
  include: typeof payablePurchaseInclude;
}>;

export const posPayableRepository = {
  findMany(params: {
    where: Prisma.PosPurchaseWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.PosPurchaseOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posPurchase.findMany({
      where,
      skip,
      take,
      orderBy,
      include: payablePurchaseInclude,
    });
  },

  count(where: Prisma.PosPurchaseWhereInput) {
    return prisma.posPurchase.count({ where });
  },

  aggregateAmounts(where: Prisma.PosPurchaseWhereInput) {
    return prisma.posPurchase.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });
  },

  async countDistinctSuppliers(where: Prisma.PosPurchaseWhereInput) {
    const rows = await prisma.posPurchase.findMany({
      where,
      distinct: ['supplierUuid'],
      select: { supplierUuid: true },
    });

    return rows.length;
  },

  listBranches() {
    return prisma.posBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  listSuppliers() {
    return prisma.posSupplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  findByUuid(uuid: string) {
    return prisma.posPurchase.findFirst({
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
    return prisma.posPurchase.update({
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
