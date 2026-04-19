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
        additionalBarcodes: { select: { barcode: true } },
        unitConversions: { orderBy: { createdAt: 'asc' } },
        branchPrices: branchUuid
          ? {
              where: { branchUuid },
              include: { branch: { select: { uuid: true, name: true, code: true } } },
            }
          : {
              include: { branch: { select: { uuid: true, name: true, code: true } } },
            },
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
        additionalBarcodes: { select: { uuid: true, barcode: true } },
        unitConversions: { orderBy: { createdAt: 'asc' } },
        branchPrices: {
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
    return prisma.posProduct.findFirst({
      where: {
        OR: [{ barcode }, { additionalBarcodes: { some: { barcode } } }],
      },
    });
  },

  findByAnyBarcodeExcludingProduct(barcode: string, productUuid: string) {
    return prisma.posProduct.findFirst({
      where: {
        uuid: { not: productUuid },
        OR: [{ barcode }, { additionalBarcodes: { some: { barcode } } }],
      },
      select: { uuid: true },
    });
  },

  findManyByUuids(uuids: string[]) {
    return prisma.posProduct.findMany({
      where: {
        uuid: { in: uuids },
      },
      select: {
        uuid: true,
        name: true,
        sku: true,
        barcode: true,
      },
    });
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

  replaceAdditionalBarcodes(productUuid: string, barcodes: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.posProductBarcode.deleteMany({ where: { productUuid } });
      if (barcodes.length > 0) {
        await tx.posProductBarcode.createMany({
          data: barcodes.map((barcode) => ({ productUuid, barcode })),
        });
      }
    });
  },

  replaceUnitConversions(
    productUuid: string,
    rows: Array<{ unit: string; factor_to_base: number; is_active?: boolean }>
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.posProductUnitConversion.deleteMany({ where: { productUuid } });
      if (rows.length > 0) {
        await tx.posProductUnitConversion.createMany({
          data: rows.map((row) => ({
            productUuid,
            unit: row.unit,
            factorToBase: row.factor_to_base,
            isActive: row.is_active ?? true,
          })),
        });
      }
    });
  },

  replaceBranchPrices(
    productUuid: string,
    rows: Array<{ branch_uuid: string; selling_price: number; wholesale_price: number }>
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.posProductBranchPrice.deleteMany({ where: { productUuid } });
      if (rows.length > 0) {
        await tx.posProductBranchPrice.createMany({
          data: rows.map((row) => ({
            productUuid,
            branchUuid: row.branch_uuid,
            sellingPrice: row.selling_price,
            wholesalePrice: row.wholesale_price,
          })),
        });
      }
    });
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
        OR: [{ barcode }, { additionalBarcodes: { some: { barcode } } }, { sku: barcode }],
        isActive: true,
      },
      include: {
        category: {
          select: { uuid: true, name: true },
        },
        additionalBarcodes: { select: { barcode: true } },
        unitConversions: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
        branchPrices: branchUuid
          ? {
              where: { branchUuid },
              include: { branch: { select: { uuid: true, name: true, code: true } } },
            }
          : {
              include: { branch: { select: { uuid: true, name: true, code: true } } },
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
