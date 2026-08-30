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

export type PurchaseListRow = Prisma.AppPosPurchaseGetPayload<{ include: typeof purchaseListInclude }>;
export type PurchaseDetailRow = Prisma.AppPosPurchaseGetPayload<{ include: typeof purchaseDetailInclude }>;

export const posPurchaseRepository = {
  findMany(params: {
    where: Prisma.AppPosPurchaseWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.AppPosPurchaseOrderByWithRelationInput;
  }) {
    const { where, skip, take, orderBy } = params;
    return prisma.appPosPurchase.findMany({
      where,
      skip,
      take,
      orderBy,
      include: purchaseListInclude,
    });
  },

  count(where: Prisma.AppPosPurchaseWhereInput) {
    return prisma.appPosPurchase.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosPurchase.findFirst({
      where: { uuid },
      include: purchaseDetailInclude,
    });
  },

  findByUuidWithItems(uuid: string) {
    return prisma.appPosPurchase.findFirst({
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
    return prisma.appPosBranch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true, code: true },
    });
  },

  listActiveSuppliers() {
    return prisma.appPosSupplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true, code: true, phone: true },
    });
  },

  listActiveProducts() {
    return prisma.appPosProduct.findMany({
      // Cuma produk 'barang' yang punya alur stok fisik/pembelian --
      // digital/jasa/ppob tidak dibeli-stok-in, dan produk sistem (mis.
      // "Komisi Agen Bank") memang bukan produk yang boleh dipilih manual.
      where: { isActive: true, kind: 'barang', isSystem: false },
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
