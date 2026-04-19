import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const posStockOpnameRepository = {
  listBranches() {
    return prisma.posBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
  },

  listProducts() {
    return prisma.posProduct.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true, sku: true, unit: true },
    });
  },

  listProductsWithStock(branchUuid: string) {
    return prisma.posProduct.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        uuid: true,
        name: true,
        sku: true,
        unit: true,
        stockItems: {
          where: { branchUuid },
          select: { stock: true },
        },
      },
    });
  },

  findOpnameMovements(params: {
    where: Prisma.PosStockMovementWhereInput;
    orderBy: Prisma.PosStockMovementOrderByWithRelationInput;
  }) {
    const { where, orderBy } = params;
    return prisma.posStockMovement.findMany({
      where,
      orderBy,
      include: {
        product: { select: { uuid: true, name: true, sku: true } },
        branch: { select: { uuid: true, name: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });
  },

  runInTransaction<T>(callback: (tx: TxClient) => Promise<T>) {
    return prisma.$transaction((tx) => callback(tx));
  },
};
