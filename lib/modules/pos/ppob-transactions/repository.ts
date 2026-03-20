import { prisma } from '@/lib/prisma';

const includeRelations = {
  branch: {
    select: {
      uuid: true,
      name: true,
    },
  },
  paymentMethod: {
    select: {
      uuid: true,
      name: true,
      type: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

export const posPpobTransactionRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posPpobTransaction.findMany({
      where,
      skip,
      take,
      orderBy,
      include: includeRelations,
    });
  },

  count(where: any) {
    return prisma.posPpobTransaction.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posPpobTransaction.findFirst({
      where: { uuid },
      include: includeRelations,
    });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.posPpobTransaction.update({
      where: { uuid },
      data: data as any,
      include: includeRelations,
    });
  },
};
