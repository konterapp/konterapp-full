import { prisma, type TransactionClient } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const transferMovementInclude = {
  product: { select: { uuid: true, name: true, sku: true, unit: true } },
  branch: { select: { uuid: true, name: true } },
  creator: { select: { id: true, name: true, email: true } },
} as const;

export type TransferMovementRow = Prisma.AppPosStockMovementGetPayload<{ include: typeof transferMovementInclude }>;

export const posStockTransferRepository = {
  // Produk 'barang' aktif + stok yang dipunyai di cabang asal -- konsisten
  // dengan stock-opname (produk digital/jasa tidak punya stok fisik).
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

  listActiveProducts() {
    return prisma.appPosProduct.findMany({
      where: { isActive: true, kind: 'barang' },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true, sku: true },
    });
  },

  findTransferMovements(params: {
    where: Prisma.AppPosStockMovementWhereInput;
    orderBy: Prisma.AppPosStockMovementOrderByWithRelationInput;
  }) {
    const { where, orderBy } = params;
    return prisma.appPosStockMovement.findMany({
      where,
      orderBy,
      include: transferMovementInclude,
    });
  },

  runInTransaction<T>(cb: (tx: TransactionClient) => Promise<T>) {
    return prisma.$transaction(cb);
  },
};
