import { Prisma } from '@prisma/client';
import { prisma, type TransactionClient } from "@/lib/prisma";

type Client = TransactionClient | typeof prisma;

export const posProductRepository = {
  runInTransaction<T>(cb: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(cb);
  },

  findMany(params: { where: any; skip: number; take: number; orderBy: any; branchUuid?: string | null }) {
    const { where, skip, take, orderBy, branchUuid } = params;

    return prisma.appPosProduct.findMany({
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
    return prisma.appPosProduct.count({ where });
  },

  findByUuid(uuid: string) {
    return prisma.appPosProduct.findFirst({
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
    return prisma.appPosProduct.findUnique({ where: { sku } });
  },

  findByBarcode(barcode: string) {
    return prisma.appPosProduct.findFirst({
      where: {
        OR: [{ barcode }, { additionalBarcodes: { some: { barcode } } }],
      },
    });
  },

  findByAnyBarcodeExcludingProduct(barcode: string, productUuid: string) {
    return prisma.appPosProduct.findFirst({
      where: {
        uuid: { not: productUuid },
        OR: [{ barcode }, { additionalBarcodes: { some: { barcode } } }],
      },
      select: { uuid: true },
    });
  },

  findManyByUuids(uuids: string[]) {
    return prisma.appPosProduct.findMany({
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

  create(tx: Client, data: Record<string, unknown>) {
    return tx.appPosProduct.create({ data: data as any });
  },

  updateByUuid(tx: Client, uuid: string, data: Record<string, unknown>) {
    return tx.appPosProduct.update({ where: { uuid }, data: data as any });
  },

  deleteByUuid(tx: Client, uuid: string) {
    return tx.appPosProduct.delete({ where: { uuid } });
  },

  async replaceAdditionalBarcodes(tx: Client, companyUuid: string, productUuid: string, barcodes: string[]) {
    await tx.appPosProductBarcode.deleteMany({ where: { productUuid } });
    if (barcodes.length > 0) {
      await tx.appPosProductBarcode.createMany({
        data: barcodes.map((barcode) => ({ companyUuid, productUuid, barcode })),
      });
    }
  },

  async replaceUnitConversions(
    tx: Client,
    companyUuid: string,
    productUuid: string,
    rows: Array<{ unit: string; factor_to_base: number; is_active?: boolean }>
  ) {
    await tx.appPosProductUnitConversion.deleteMany({ where: { productUuid } });
    if (rows.length > 0) {
      await tx.appPosProductUnitConversion.createMany({
        data: rows.map((row) => ({
          companyUuid,
          productUuid,
          unit: row.unit,
          factorToBase: row.factor_to_base,
          isActive: row.is_active ?? true,
        })),
      });
    }
  },

  async replaceBranchPrices(
    tx: Client,
    companyUuid: string,
    productUuid: string,
    rows: Array<{ branch_uuid: string; selling_price: number; wholesale_price: number }>
  ) {
    await tx.appPosProductBranchPrice.deleteMany({ where: { productUuid } });
    if (rows.length > 0) {
      await tx.appPosProductBranchPrice.createMany({
        data: rows.map((row) => ({
          companyUuid,
          productUuid,
          branchUuid: row.branch_uuid,
          sellingPrice: row.selling_price,
          wholesalePrice: row.wholesale_price,
        })),
      });
    }
  },

  createImage(tx: Client, data: { companyUuid: string; productUuid: string; image: string; isPrimary: boolean; sortOrder: number }) {
    return tx.appPosProductImage.create({ data });
  },

  findImagesByProduct(tx: Client, productUuid: string) {
    return tx.appPosProductImage.findMany({
      where: { productUuid },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findImagesByUuids(tx: Client, productUuid: string, uuids: string[]) {
    return tx.appPosProductImage.findMany({
      where: {
        productUuid,
        uuid: { in: uuids },
      },
    });
  },

  deleteImagesByUuids(tx: Client, productUuid: string, uuids: string[]) {
    return tx.appPosProductImage.deleteMany({
      where: {
        productUuid,
        uuid: { in: uuids },
      },
    });
  },

  setAllImagesNonPrimary(tx: Client, productUuid: string) {
    return tx.appPosProductImage.updateMany({
      where: { productUuid },
      data: { isPrimary: false },
    });
  },

  setImagePrimary(tx: Client, productUuid: string, imageUuid: string) {
    return tx.appPosProductImage.updateMany({
      where: { productUuid, uuid: imageUuid },
      data: { isPrimary: true },
    });
  },

  setImagePrimaryByUuid(tx: Client, imageUuid: string) {
    return tx.appPosProductImage.update({
      where: { uuid: imageUuid },
      data: { isPrimary: true },
    });
  },

  aggregateMaxSortOrder(tx: Client, productUuid: string) {
    return tx.appPosProductImage.aggregate({
      where: { productUuid },
      _max: { sortOrder: true },
    });
  },

  countTransactionItems(productUuid: string) {
    return Promise.all([
      prisma.appPosSaleItem.count({ where: { productUuid } }),
      prisma.appPosPurchaseItem.count({ where: { productUuid } }),
    ]);
  },

  findActiveByBarcodeOrSku(barcode: string, branchUuid?: string | null) {
    return prisma.appPosProduct.findFirst({
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
