import { prisma } from '@/lib/prisma';

export const posPurchaseRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posPurchase.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        branch: { select: { uuid: true, name: true } },
        supplier: { select: { uuid: true, name: true, code: true } },
      },
    });
  },

  count(where: any) {
    return prisma.posPurchase.count({ where });
  },

  findByUuidWithItems(uuid: string) {
    return prisma.posPurchase.findFirst({
      where: { uuid },
      include: { items: true },
    });
  },

  runInTransaction<T>(cb: (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>) {
    return prisma.$transaction(cb as any);
  },
};
