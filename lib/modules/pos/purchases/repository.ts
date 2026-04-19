import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const purchaseListInclude = {
  branch: { select: { uuid: true, name: true, code: true } },
  supplier: { select: { uuid: true, name: true, code: true, phone: true } },
} as const;

const purchaseDetailInclude = {
  branch: { select: { uuid: true, name: true, code: true } },
  supplier: { select: { uuid: true, name: true, code: true, phone: true } },
  creator: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      product: {
        select: {
          uuid: true,
          name: true,
          sku: true,
          unit: true,
        },
      },
    },
  },
} as const;

export type PurchaseListRow = Prisma.PosPurchaseGetPayload<{ include: typeof purchaseListInclude }>;
export type PurchaseDetailRow = Prisma.PosPurchaseGetPayload<{ include: typeof purchaseDetailInclude }>;

export const posPurchaseRepository = {
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
      include: purchaseListInclude,
    });
  },

  count(where: Prisma.PosPurchaseWhereInput) {
    return prisma.posPurchase.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posPurchase.findFirst({
      where: { uuid },
      include: purchaseDetailInclude,
    });
  },

  findByUuidWithItems(uuid: string) {
    return prisma.posPurchase.findFirst({
      where: { uuid },
      include: {
        items: {
          include: {
            product: {
              select: {
                uuid: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });
  },

  listActiveBranches() {
    return prisma.posBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true, code: true },
    });
  },

  listActiveSuppliers() {
    return prisma.posSupplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true, code: true, phone: true },
    });
  },

  listActiveProducts() {
    return prisma.posProduct.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        uuid: true,
        name: true,
        sku: true,
        unit: true,
        purchasePrice: true,
        unitConversions: {
          where: { isActive: true },
          select: {
            unit: true,
            factorToBase: true,
            isActive: true,
          },
        },
      },
    });
  },

  runInTransaction<T>(cb: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(cb);
  },
};
