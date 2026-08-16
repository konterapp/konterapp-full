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
} satisfies Prisma.AppPosSaleInclude;

export type ReceivableSaleRow = Prisma.AppPosSaleGetPayload<{
  include: typeof receivableSaleInclude;
}>;

export const posReceivableRepository = {
  findMany(params: {
    where: Prisma.AppPosSaleWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.AppPosSaleOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosSale.findMany({
      where,
      skip,
      take,
      orderBy,
      include: receivableSaleInclude,
    });
  },

  count(where: Prisma.AppPosSaleWhereInput) {
    return prisma.appPosSale.count({ where });
  },

  aggregateAmounts(where: Prisma.AppPosSaleWhereInput) {
    return prisma.appPosSale.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });
  },

  async countDistinctCustomers(where: Prisma.AppPosSaleWhereInput) {
    const rows = await prisma.appPosSale.findMany({
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
    return prisma.appPosBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  listCustomers() {
    return prisma.appPosCustomer.findMany({
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },
};
