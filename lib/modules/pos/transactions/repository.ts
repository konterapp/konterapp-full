import { prisma } from '@/lib/prisma';

export const posTransactionRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy?: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.posSale.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
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
        items: {
          include: {
            product: {
              select: { uuid: true, name: true, sku: true, image: true },
            },
          },
        },
      },
    });
  },

  count(where: any) {
    return prisma.posSale.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posSale.findFirst({
      where: { uuid },
      include: {
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
        items: {
          include: {
            product: {
              select: { uuid: true, name: true, sku: true, image: true },
            },
          },
        },
      },
    });
  },

  runInTransaction<T>(cb: (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>) {
    return prisma.$transaction(cb as any);
  },
};
