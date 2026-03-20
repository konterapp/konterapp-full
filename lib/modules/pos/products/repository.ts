import { prisma } from '@/lib/prisma';

export const posProductRepository = {
  findMany(params: { where: any; skip: number; take: number; orderBy: any; branchUuid?: string | null }) {
    const { where, skip, take, orderBy, branchUuid } = params;

    return prisma.posProduct.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        category: { select: { uuid: true, name: true } },
        stockItems: branchUuid
          ? {
              where: { branchUuid },
              select: { branchUuid: true, stock: true },
            }
          : true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  },

  count(where: any) {
    return prisma.posProduct.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.posProduct.findFirst({
      where: { uuid },
      include: {
        category: { select: { uuid: true, name: true } },
        stockItems: {
          include: { branch: { select: { uuid: true, name: true, code: true } } },
        },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  },

  findBySku(sku: string) {
    return prisma.posProduct.findUnique({ where: { sku } });
  },

  findByBarcode(barcode: string) {
    return prisma.posProduct.findFirst({ where: { barcode } });
  },

  create(data: Record<string, unknown>) {
    return prisma.posProduct.create({ data: data as any });
  },

  updateByUuid(uuid: string, data: Record<string, unknown>) {
    return prisma.posProduct.update({ where: { uuid }, data: data as any });
  },

  deleteByUuid(uuid: string) {
    return prisma.posProduct.delete({ where: { uuid } });
  },

  createImage(data: { productUuid: string; image: string; isPrimary: boolean; sortOrder: number }) {
    return prisma.posProductImage.create({ data });
  },

  findImagesByProduct(productUuid: string) {
    return prisma.posProductImage.findMany({
      where: { productUuid },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findImagesByUuids(productUuid: string, uuids: string[]) {
    return prisma.posProductImage.findMany({
      where: {
        productUuid,
        uuid: { in: uuids },
      },
    });
  },

  deleteImagesByUuids(productUuid: string, uuids: string[]) {
    return prisma.posProductImage.deleteMany({
      where: {
        productUuid,
        uuid: { in: uuids },
      },
    });
  },

  deleteImagesByProduct(productUuid: string) {
    return prisma.posProductImage.deleteMany({ where: { productUuid } });
  },

  setAllImagesNonPrimary(productUuid: string) {
    return prisma.posProductImage.updateMany({
      where: { productUuid },
      data: { isPrimary: false },
    });
  },

  setImagePrimary(productUuid: string, imageUuid: string) {
    return prisma.posProductImage.updateMany({
      where: { productUuid, uuid: imageUuid },
      data: { isPrimary: true },
    });
  },

  setImagePrimaryByUuid(imageUuid: string) {
    return prisma.posProductImage.update({
      where: { uuid: imageUuid },
      data: { isPrimary: true },
    });
  },

  aggregateMaxSortOrder(productUuid: string) {
    return prisma.posProductImage.aggregate({
      where: { productUuid },
      _max: { sortOrder: true },
    });
  },

  countTransactionItems(productUuid: string) {
    return Promise.all([
      prisma.posSaleItem.count({ where: { productUuid } }),
      prisma.posPurchaseItem.count({ where: { productUuid } }),
    ]);
  },

  findActiveByBarcodeOrSku(barcode: string, branchUuid?: string | null) {
    return prisma.posProduct.findFirst({
      where: {
        OR: [{ barcode }, { sku: barcode }],
        isActive: true,
      },
      include: {
        category: {
          select: { uuid: true, name: true },
        },
        stockItems: branchUuid
          ? {
              where: { branchUuid },
              select: { branchUuid: true, stock: true },
            }
          : true,
      },
    });
  },
};
