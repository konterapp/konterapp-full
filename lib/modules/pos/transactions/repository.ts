import { prisma } from '@/lib/prisma';

export const posTransactionRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy?: any }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosSale.findMany({
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
              select: {
                uuid: true,
                name: true,
                sku: true,
                images: {
                  select: { image: true, isPrimary: true, sortOrder: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });
  },

  count(where: any) {
    return prisma.appPosSale.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosSale.findFirst({
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
              select: {
                uuid: true,
                name: true,
                sku: true,
                images: {
                  select: { image: true, isPrimary: true, sortOrder: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
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
