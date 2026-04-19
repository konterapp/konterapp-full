import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { posStockOpnameRepository } from './repository';
import { mapStockOpnameHistoryDocument, mapStockOpnameHistoryItem } from './stock-opname.mapper';
import { getTenantCompanyUuid } from '@/lib/tenant-context';

function roundDateEnd(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export const posStockOpnameService = {
  async getCreateOptions(branchUuid: string | null) {
    const branches = await posStockOpnameRepository.listBranches();

    if (branchUuid) {
      const productsWithStock = await posStockOpnameRepository.listProductsWithStock(branchUuid);
      return {
        branches,
        products: productsWithStock.map((product) => ({
          uuid: product.uuid,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          current_stock: Number(product.stockItems[0]?.stock ?? 0),
        })),
      };
    }

    const products = await posStockOpnameRepository.listProducts();
    return {
      branches,
      products: products.map((product) => ({
        uuid: product.uuid,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        current_stock: 0,
      })),
    };
  },

  async listOpnameHistory(params: {
    page: number;
    perPage: number;
    search: string;
    branchUuid: string;
    productUuid: string;
    dateFrom: string | null;
    dateTo: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, perPage, search, branchUuid, productUuid, dateFrom, dateTo, sortBy, sortOrder } = params;

    const where: Prisma.PosStockMovementWhereInput = {
      movementType: 'adjustment',
      referenceType: 'stock_opname',
      referenceUuid: { not: null },
    };

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
        { referenceUuid: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (branchUuid) where.branchUuid = branchUuid;
    if (productUuid) where.productUuid = productUuid;
    if (dateFrom || dateTo) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = roundDateEnd(new Date(dateTo));
      where.createdAt = createdAt;
    }

    const rows = await posStockOpnameRepository.findOpnameMovements({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<
      string,
      {
        referenceUuid: string;
        createdAt: Date;
        notes: string | null;
        branch: { uuid: string; name: string } | null;
        creator: { id: number; name: string; email: string } | null;
        items: ReturnType<typeof mapStockOpnameHistoryItem>[];
      }
    >();

    for (const row of rows) {
      const referenceUuid = row.referenceUuid || row.uuid;
      const current = grouped.get(referenceUuid);
      const mappedItem = mapStockOpnameHistoryItem(row);

      if (!current) {
        grouped.set(referenceUuid, {
          referenceUuid,
          createdAt: row.createdAt,
          notes: row.notes,
          branch: row.branch,
          creator: row.creator,
          items: [mappedItem],
        });
      } else {
        current.items.push(mappedItem);
      }
    }

    const documents = Array.from(grouped.values()).map((doc) =>
      mapStockOpnameHistoryDocument({
        referenceUuid: doc.referenceUuid,
        createdAt: doc.createdAt,
        notes: doc.notes,
        branch: doc.branch,
        creator: doc.creator,
        items: doc.items,
      })
    );

    const sortedDocuments = [...documents].sort((a, b) => {
      if (sortBy === 'items_count') {
        return sortOrder === 'asc' ? a.items_count - b.items_count : b.items_count - a.items_count;
      }
      if (sortBy === 'total_adjustment') {
        return sortOrder === 'asc' ? a.total_adjustment - b.total_adjustment : b.total_adjustment - a.total_adjustment;
      }

      const left = new Date(a.created_at).getTime();
      const right = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? left - right : right - left;
    });

    const total = sortedDocuments.length;
    const skip = (page - 1) * perPage;
    const data = sortedDocuments.slice(skip, skip + perPage);

    const [branches, products] = await Promise.all([
      posStockOpnameRepository.listBranches(),
      posStockOpnameRepository.listProducts(),
    ]);

    return {
      data,
      filters: {
        branches,
        products,
      },
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async createOpname(
    payload: {
      branchUuid: string;
      notes?: string | null;
      items: Array<{ productUuid: string; actualStock: number }>;
    },
    userId: number
  ) {
    if (!payload.items.length) {
      throw new ValidationApiError({ items: ['Minimal 1 produk untuk opname'] });
    }

    const seenProducts = new Set<string>();
    for (const item of payload.items) {
      if (seenProducts.has(item.productUuid)) {
        throw new ValidationApiError({ items: ['Produk dalam 1 dokumen opname tidak boleh duplikat'] });
      }
      seenProducts.add(item.productUuid);
    }

    const referenceUuid = uuidv7();
    const companyUuid = getTenantCompanyUuid();
    if (!companyUuid) {
      throw new ApiError('Konteks perusahaan tidak ditemukan', 500);
    }

    await posStockOpnameRepository.runInTransaction(async (tx) => {
      const branch = await tx.posBranch.findFirst({
        where: {
          uuid: payload.branchUuid,
          isActive: true,
        },
      });
      if (!branch) {
        throw new ApiError('Cabang tidak ditemukan', 404);
      }

      const productUuids = payload.items.map((item) => item.productUuid);

      const [products, existingStocks] = await Promise.all([
        tx.posProduct.findMany({
          where: {
            uuid: { in: productUuids },
            isActive: true,
          },
          select: { uuid: true, name: true, sku: true },
        }),
        tx.posProductStock.findMany({
          where: {
            branchUuid: payload.branchUuid,
            productUuid: { in: productUuids },
          },
          select: { uuid: true, productUuid: true, stock: true },
        }),
      ]);

      if (products.length !== productUuids.length) {
        throw new ValidationApiError({ items: ['Sebagian produk tidak ditemukan atau tidak aktif'] });
      }

      const stockMap = new Map(existingStocks.map((row) => [row.productUuid, row]));

      for (const item of payload.items) {
        const existingStock = stockMap.get(item.productUuid);
        const previousStock = Number(existingStock?.stock ?? 0);
        const nextStock = Number(item.actualStock);
        const quantityChange = nextStock - previousStock;

        if (existingStock) {
          await tx.posProductStock.update({
            where: { uuid: existingStock.uuid },
            data: { stock: nextStock },
          });
        } else {
          await tx.posProductStock.create({
            data: {
              branchUuid: payload.branchUuid,
              productUuid: item.productUuid,
              stock: nextStock,
            },
          });
        }

        await tx.posStockMovement.create({
          data: {
            companyUuid,
            branchUuid: payload.branchUuid,
            productUuid: item.productUuid,
            movementType: 'adjustment',
            quantity: quantityChange,
            previousStock,
            newStock: nextStock,
            referenceType: 'stock_opname',
            referenceUuid,
            notes: payload.notes?.trim() || `Stok opname dokumen ${referenceUuid}`,
            createdBy: userId,
          },
          include: {
            product: { select: { uuid: true, name: true, sku: true } },
            branch: { select: { uuid: true, name: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
        });
      }
    });

    const createdRows = await posStockOpnameRepository.findOpnameMovements({
      where: {
        referenceType: 'stock_opname',
        referenceUuid,
      },
      orderBy: { createdAt: 'asc' },
    });

    const items = createdRows.map(mapStockOpnameHistoryItem);

    return mapStockOpnameHistoryDocument({
      referenceUuid,
      createdAt: createdRows[0]?.createdAt || new Date(),
      notes: payload.notes?.trim() || null,
      branch: createdRows[0]?.branch || null,
      creator: createdRows[0]?.creator || null,
      items,
    });
  },
};
