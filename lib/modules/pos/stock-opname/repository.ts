import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const posStockOpnameRepository = {
  listProducts() {
    return prisma.appPosProduct.findMany({
      // Stok opname cuma relevan buat produk 'barang' -- digital/jasa/ppob
      // tidak punya stok fisik buat dihitung ulang.
      where: { isActive: true, kind: 'barang' },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true, sku: true, unit: true },
    });
  },

  listProductsWithStock(branchUuid: string) {
    return prisma.appPosProduct.findMany({
      where: { isActive: true, kind: 'barang' },
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
    where: Prisma.AppPosStockMovementWhereInput;
    orderBy: Prisma.AppPosStockMovementOrderByWithRelationInput;
  }) {
    const { where, orderBy } = params;
    return prisma.appPosStockMovement.findMany({
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
