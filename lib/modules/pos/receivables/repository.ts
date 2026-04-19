import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const receivableSaleInclude = {
  branch: {
    select: { uuid: true, name: true, code: true },
  },
  customer: {
    select: { uuid: true, name: true, phone: true },
  },
  paymentMethod: {
    select: { uuid: true, name: true, code: true },
  },
  creator: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.PosSaleInclude;

export type ReceivableSaleRow = Prisma.PosSaleGetPayload<{
  include: typeof receivableSaleInclude;
}>;

export const posReceivableRepository = {
  findMany(params: {
    where: Prisma.PosSaleWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.PosSaleOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posSale.findMany({
      where,
      skip,
      take,
      orderBy,
      include: receivableSaleInclude,
    });
  },

  count(where: Prisma.PosSaleWhereInput) {
    return prisma.posSale.count({ where });
  },

  aggregateAmounts(where: Prisma.PosSaleWhereInput) {
    return prisma.posSale.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });
  },

  async countDistinctCustomers(where: Prisma.PosSaleWhereInput) {
    const rows = await prisma.posSale.findMany({
      where: {
        ...where,
        customerUuid: { not: null },
      },
      distinct: ['customerUuid'],
      select: { customerUuid: true },
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

  listCustomers() {
    return prisma.posCustomer.findMany({
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },
};
