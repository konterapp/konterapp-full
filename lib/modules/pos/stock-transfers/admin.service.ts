import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { posStockTransferRepository, type TransferMovementRow } from './repository';
import { mapStockTransferHistoryDocument, mapStockTransferHistoryItem } from './stock-transfer.mapper';
import { getTenantCompanyUuid } from '@/lib/tenant-context';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';
import { posBranchRepository } from '@/lib/modules/pos/branches/repository';
import { mapBranchListSimple } from '@/lib/modules/pos/branches/branch.mapper';
import { appUserRepository } from '@/lib/modules/users/app.repository';

function roundDateEnd(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

// Satu dokumen transfer = sepasang baris AppPosStockMovement (transfer_out di
// cabang asal, transfer_in di cabang tujuan) yang berbagi referenceUuid --
// polanya sama dengan stock-opname (tidak ada tabel header terpisah, ledger
// movement itu sendiri jadi sumber kebenaran).
function buildTransferDocument(referenceUuid: string, rows: TransferMovementRow[]) {
  const outRows = rows.filter((row) => row.movementType === 'transfer_out');
  const inRows = rows.filter((row) => row.movementType === 'transfer_in');
  const earliest = rows.reduce((min, row) => (row.createdAt < min ? row.createdAt : min), rows[0].createdAt);

  return mapStockTransferHistoryDocument({
    referenceUuid,
    createdAt: earliest,
    notes: rows[0]?.notes ?? null,
    fromBranch: outRows[0]?.branch ?? null,
    toBranch: inRows[0]?.branch ?? null,
    creator: rows[0]?.creator ?? null,
    // Item diambil dari sisi OUT saja -- magnitude-nya identik dgn sisi IN
    // untuk produk yang sama, dan mapper sudah menormalkan tanda jadi positif.
    items: (outRows.length > 0 ? outRows : inRows).map(mapStockTransferHistoryItem),
  });
}

export const posStockTransferService = {
  async getCreateOptions(companyUuid: string, userId: number, fromBranchUuid: string | null) {
    const [fromBranches, allBranches] = await Promise.all([
      // Cabang asal dibatasi ke cabang yang di-assign ke user (kalau user
      // dibatasi cabang) -- kamu cuma boleh MENGAMBIL stok dari cabang tempat
      // kamu bertugas.
      posBranchService.listBranchOptions(companyUuid, userId),
      posBranchRepository.listSimple(),
    ]);

    // Cabang tujuan sengaja TIDAK dibatasi ke assigned branches -- mengirim
    // stok ke cabang lain wajar dilakukan walau kamu tidak bertugas di sana.
    const toBranches = allBranches.filter((branch) => branch.isActive).map(mapBranchListSimple);

    if (!fromBranchUuid) {
      return { from_branches: fromBranches, to_branches: toBranches, products: [] };
    }

    const productsWithStock = await posStockTransferRepository.listProductsWithStock(fromBranchUuid);
    return {
      from_branches: fromBranches,
      to_branches: toBranches,
      products: productsWithStock
        .map((product) => ({
          uuid: product.uuid,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          current_stock: Number(product.stockItems[0]?.stock ?? 0),
        }))
        // Tidak ada gunanya menawarkan produk yang stoknya 0 di cabang asal.
        .filter((product) => product.current_stock > 0),
    };
  },

  async listTransferHistory(params: {
    page: number;
    perPage: number;
    search: string;
    fromBranchUuid: string;
    toBranchUuid: string;
    productUuid: string;
    dateFrom: string | null;
    dateTo: string | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    companyUuid: string;
    userId: number;
  }) {
    const { page, perPage, search, fromBranchUuid, toBranchUuid, productUuid, dateFrom, dateTo, sortBy, sortOrder, companyUuid, userId } = params;

    const where: Prisma.AppPosStockMovementWhereInput = {
      referenceType: 'stock_transfer',
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
    if (productUuid) where.productUuid = productUuid;
    if (dateFrom || dateTo) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = roundDateEnd(new Date(dateTo));
      where.createdAt = createdAt;
    }

    // Filter cabang SENGAJA tidak ditaruh di `where` Prisma di atas: baris
    // out & in punya branchUuid yang beda (itu intinya transfer), jadi
    // memfilter di level baris akan membuang salah satu sisi pasangannya dan
    // dokumen jadi tidak lengkap (from/to hilang). Grouping dilakukan dulu
    // dari data TANPA filter cabang, baru filter cabang diterapkan ke hasil
    // dokumen yang sudah lengkap kedua sisinya.
    const rows = await posStockTransferRepository.findTransferMovements({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<string, TransferMovementRow[]>();
    for (const row of rows) {
      const referenceUuid = row.referenceUuid || row.uuid;
      const bucket = grouped.get(referenceUuid);
      if (bucket) bucket.push(row);
      else grouped.set(referenceUuid, [row]);
    }

    let documents = Array.from(grouped.entries()).map(([referenceUuid, groupRows]) =>
      buildTransferDocument(referenceUuid, groupRows)
    );

    if (fromBranchUuid) documents = documents.filter((doc) => doc.from_branch?.uuid === fromBranchUuid);
    if (toBranchUuid) documents = documents.filter((doc) => doc.to_branch?.uuid === toBranchUuid);

    const sortedDocuments = [...documents].sort((a, b) => {
      if (sortBy === 'items_count') {
        return sortOrder === 'asc' ? a.items_count - b.items_count : b.items_count - a.items_count;
      }
      if (sortBy === 'total_quantity') {
        return sortOrder === 'asc' ? a.total_quantity - b.total_quantity : b.total_quantity - a.total_quantity;
      }

      const left = new Date(a.created_at).getTime();
      const right = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? left - right : right - left;
    });

    const total = sortedDocuments.length;
    const skip = (page - 1) * perPage;
    const data = sortedDocuments.slice(skip, skip + perPage);

    const [branches, products] = await Promise.all([
      posBranchService.listBranchOptions(companyUuid, userId),
      posStockTransferRepository.listActiveProducts(),
    ]);

    return {
      data,
      filters: { branches, products },
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async createTransfer(
    payload: {
      fromBranchUuid: string;
      toBranchUuid: string;
      notes?: string | null;
      items: Array<{ productUuid: string; quantity: number }>;
    },
    userId: number
  ) {
    if (!payload.items.length) {
      throw new ValidationApiError({ items: ['Minimal 1 produk untuk transfer'] });
    }
    if (payload.fromBranchUuid === payload.toBranchUuid) {
      throw new ValidationApiError({ to_branch_uuid: ['Cabang asal dan tujuan tidak boleh sama'] });
    }

    const seenProducts = new Set<string>();
    for (const item of payload.items) {
      if (seenProducts.has(item.productUuid)) {
        throw new ValidationApiError({ items: ['Produk dalam 1 dokumen transfer tidak boleh duplikat'] });
      }
      seenProducts.add(item.productUuid);

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new ValidationApiError({ items: ['Qty transfer harus bilangan bulat dan lebih dari 0'] });
      }
    }

    const companyUuid = getTenantCompanyUuid();
    if (!companyUuid) {
      throw new ApiError('Konteks perusahaan tidak ditemukan', 500);
    }

    // Cabang asal wajib salah satu cabang yang di-assign ke user (kalau user
    // dibatasi cabang) -- aturan yang sama dgn stock-opname. Cabang tujuan
    // sengaja TIDAK dicek di sini (lihat komentar di getCreateOptions).
    const assignedBranchUuids = await appUserRepository.getAssignedBranchUuids(companyUuid, userId);
    if (assignedBranchUuids.length > 0 && !assignedBranchUuids.includes(payload.fromBranchUuid)) {
      throw new ApiError('Anda tidak punya akses ke cabang asal ini', 403);
    }

    const referenceUuid = uuidv7();

    await posStockTransferRepository.runInTransaction(async (tx) => {
      const [fromBranch, toBranch] = await Promise.all([
        tx.appPosBranch.findFirst({ where: { uuid: payload.fromBranchUuid, isActive: true } }),
        tx.appPosBranch.findFirst({ where: { uuid: payload.toBranchUuid, isActive: true } }),
      ]);
      if (!fromBranch) {
        throw new ApiError('Cabang asal tidak ditemukan atau tidak aktif', 404);
      }
      if (!toBranch) {
        throw new ApiError('Cabang tujuan tidak ditemukan atau tidak aktif', 404);
      }

      const productUuids = payload.items.map((item) => item.productUuid);
      const [products, fromStocks] = await Promise.all([
        tx.appPosProduct.findMany({
          where: { uuid: { in: productUuids }, isActive: true, kind: 'barang' },
          select: { uuid: true, name: true, sku: true },
        }),
        tx.appPosProductStock.findMany({
          where: { companyUuid, branchUuid: payload.fromBranchUuid, productUuid: { in: productUuids } },
          select: { uuid: true, productUuid: true, stock: true },
        }),
      ]);

      if (products.length !== productUuids.length) {
        throw new ValidationApiError({ items: ['Sebagian produk tidak ditemukan, tidak aktif, atau bukan produk barang'] });
      }

      const productMap = new Map(products.map((product) => [product.uuid, product]));
      const fromStockMap = new Map(fromStocks.map((stock) => [stock.productUuid, stock]));
      const notes = payload.notes?.trim() || null;

      for (const item of payload.items) {
        const product = productMap.get(item.productUuid)!;
        const fromStock = fromStockMap.get(item.productUuid);
        const fromPreviousStock = Number(fromStock?.stock ?? 0);

        if (fromPreviousStock < item.quantity) {
          throw new ValidationApiError({
            items: [`Stok ${product.name} di cabang asal tidak cukup (tersedia: ${fromPreviousStock}, diminta: ${item.quantity})`],
          });
        }

        const fromNewStock = fromPreviousStock - item.quantity;
        await tx.appPosProductStock.update({
          where: { uuid: fromStock!.uuid },
          data: { stock: fromNewStock },
        });
        await tx.appPosStockMovement.create({
          data: {
            companyUuid,
            branchUuid: payload.fromBranchUuid,
            productUuid: item.productUuid,
            movementType: 'transfer_out',
            quantity: -item.quantity,
            previousStock: fromPreviousStock,
            newStock: fromNewStock,
            referenceType: 'stock_transfer',
            referenceUuid,
            notes,
            createdBy: userId,
          },
        });

        const toStock = await tx.appPosProductStock.findFirst({
          where: { companyUuid, branchUuid: payload.toBranchUuid, productUuid: item.productUuid },
        });
        const toPreviousStock = Number(toStock?.stock ?? 0);
        const toNewStock = toPreviousStock + item.quantity;

        if (toStock) {
          await tx.appPosProductStock.update({
            where: { uuid: toStock.uuid },
            data: { stock: toNewStock },
          });
        } else {
          await tx.appPosProductStock.create({
            data: {
              companyUuid,
              branchUuid: payload.toBranchUuid,
              productUuid: item.productUuid,
              stock: toNewStock,
            },
          });
        }

        await tx.appPosStockMovement.create({
          data: {
            companyUuid,
            branchUuid: payload.toBranchUuid,
            productUuid: item.productUuid,
            movementType: 'transfer_in',
            quantity: item.quantity,
            previousStock: toPreviousStock,
            newStock: toNewStock,
            referenceType: 'stock_transfer',
            referenceUuid,
            notes,
            createdBy: userId,
          },
        });
      }
    });

    return this.getTransferDetail(referenceUuid);
  },

  async getTransferDetail(referenceUuid: string) {
    const rows = await posStockTransferRepository.findTransferMovements({
      where: { referenceType: 'stock_transfer', referenceUuid },
      orderBy: { createdAt: 'asc' },
    });
    if (!rows.length) {
      throw new ApiError('Dokumen transfer tidak ditemukan', 404);
    }
    return buildTransferDocument(referenceUuid, rows);
  },
};
