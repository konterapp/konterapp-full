import { Prisma } from '@prisma/client';
import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { getTenantCompanyUuid } from '@/lib/tenant-context';
import { posPurchaseRepository } from './repository';
import { mapPurchaseDetail, mapPurchaseListItem } from './purchase.mapper';

type PurchaseItemInput = {
  productUuid: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

type PurchasePayloadInput = {
  branchUuid: string;
  supplierUuid: string;
  purchaseDate?: string | null;
  discountAmount?: number;
  paidAmount?: number;
  notes?: string | null;
  items: PurchaseItemInput[];
};

function generatePurchaseNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `PO-${year}${month}${day}-${random}`;
}

function normalizeItems(items: PurchaseItemInput[]) {
  const seenProducts = new Set<string>();

  return items.map((item) => {
    if (seenProducts.has(item.productUuid)) {
      throw new ValidationApiError({ items: ['Produk pada pembelian tidak boleh duplikat'] });
    }
    seenProducts.add(item.productUuid);

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ValidationApiError({ items: ['Qty item harus bilangan bulat dan lebih dari 0'] });
    }

    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new ValidationApiError({ items: ['Harga beli item tidak valid'] });
    }

    const discount = Number(item.discount || 0);
    const maxDiscount = item.quantity * item.unitPrice;
    if (!Number.isFinite(discount) || discount < 0 || discount > maxDiscount) {
      throw new ValidationApiError({ items: ['Diskon item tidak boleh negatif atau melebihi subtotal item'] });
    }

    return {
      productUuid: item.productUuid,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount,
    };
  });
}

function computeTotals(args: {
  items: ReturnType<typeof normalizeItems>;
  discountAmount?: number;
  paidAmount?: number;
  forceDraft: boolean;
}) {
  const { items, discountAmount, paidAmount, forceDraft } = args;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const itemDiscountTotal = items.reduce((sum, item) => sum + item.discount, 0);

  const globalDiscount = Number(discountAmount || 0);
  if (!Number.isFinite(globalDiscount) || globalDiscount < 0) {
    throw new ValidationApiError({ discount_amount: ['Diskon tidak boleh negatif'] });
  }

  const totalDiscount = itemDiscountTotal + globalDiscount;
  const totalAmount = subtotal - totalDiscount;

  if (totalAmount <= 0) {
    throw new ValidationApiError({ discount_amount: ['Total pembelian harus lebih dari 0'] });
  }

  const requestedPaidAmount = Number(paidAmount || 0);
  if (!Number.isFinite(requestedPaidAmount) || requestedPaidAmount < 0) {
    throw new ValidationApiError({ paid_amount: ['Nominal bayar tidak valid'] });
  }

  const finalPaidAmount = forceDraft ? 0 : requestedPaidAmount;
  if (!forceDraft && finalPaidAmount > totalAmount) {
    throw new ValidationApiError({ paid_amount: ['Nominal bayar tidak boleh melebihi total pembelian'] });
  }

  const paymentStatus = forceDraft
    ? 'draft'
    : finalPaidAmount <= 0
      ? 'pending'
      : finalPaidAmount < totalAmount
        ? 'partial'
        : 'paid';

  return {
    subtotal,
    totalDiscount,
    totalAmount,
    finalPaidAmount,
    paymentStatus,
  };
}

function parsePurchaseDate(purchaseDate?: string | null) {
  const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date();
  if (Number.isNaN(parsedPurchaseDate.getTime())) {
    throw new ValidationApiError({ purchase_date: ['Tanggal pembelian tidak valid'] });
  }
  return parsedPurchaseDate;
}

async function assertPurchaseReferencesExist(
  tx: Prisma.TransactionClient,
  params: {
    branchUuid: string;
    supplierUuid: string;
    items: ReturnType<typeof normalizeItems>;
  }
) {
  const { branchUuid, supplierUuid, items } = params;

  const [branch, supplier, products] = await Promise.all([
    tx.posBranch.findFirst({ where: { uuid: branchUuid, isActive: true } }),
    tx.posSupplier.findFirst({ where: { uuid: supplierUuid, isActive: true } }),
    tx.posProduct.findMany({
      where: {
        uuid: { in: items.map((item) => item.productUuid) },
        isActive: true,
      },
      select: { uuid: true },
    }),
  ]);

  if (!branch) {
    throw new ApiError('Cabang tidak ditemukan atau tidak aktif', 404);
  }
  if (!supplier) {
    throw new ApiError('Supplier tidak ditemukan atau tidak aktif', 404);
  }
  if (products.length !== items.length) {
    throw new ValidationApiError({ items: ['Sebagian produk tidak ditemukan atau tidak aktif'] });
  }
}

async function applyStockInForItems(
  tx: Prisma.TransactionClient,
  params: {
    companyUuid: string;
    branchUuid: string;
    purchaseUuid: string;
    purchaseNumber: string;
    userId: number;
    items: ReturnType<typeof normalizeItems>;
  }
) {
  const { companyUuid, branchUuid, purchaseUuid, purchaseNumber, userId, items } = params;

  for (const item of items) {
    const stock = await tx.posProductStock.findFirst({
      where: {
        productUuid: item.productUuid,
        branchUuid,
      },
    });

    const previousStock = Number(stock?.stock ?? 0);
    const newStock = previousStock + item.quantity;

    if (stock) {
      await tx.posProductStock.update({
        where: { uuid: stock.uuid },
        data: { stock: newStock },
      });
    } else {
      await tx.posProductStock.create({
        data: {
          productUuid: item.productUuid,
          branchUuid,
          stock: newStock,
        },
      });
    }

    await tx.posStockMovement.create({
      data: {
        companyUuid,
        branchUuid,
        productUuid: item.productUuid,
        movementType: 'purchase',
        quantity: item.quantity,
        previousStock,
        newStock,
        referenceType: 'Purchase',
        referenceUuid: purchaseUuid,
        notes: `Purchase: ${purchaseNumber}`,
        createdBy: userId,
      },
    });
  }
}

export const posPurchaseService = {
  async listPurchases(params: {
    page: number;
    perPage: number;
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    branchUuid: string;
    supplierUuid: string;
    paymentStatus: string;
  }) {
    const { page, perPage, search, sortBy, sortOrder, branchUuid, supplierUuid, paymentStatus } = params;
    const skip = (page - 1) * perPage;

    const where: Prisma.PosPurchaseWhereInput = {};
    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (branchUuid) where.branchUuid = branchUuid;
    if (supplierUuid) where.supplierUuid = supplierUuid;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const sortMap: Record<string, Prisma.PosPurchaseOrderByWithRelationInput> = {
      created_at: { createdAt: sortOrder },
      purchase_date: { purchaseDate: sortOrder },
      total_amount: { totalAmount: sortOrder },
      payment_status: { paymentStatus: sortOrder },
      purchase_number: { purchaseNumber: sortOrder },
    };
    const orderBy = sortMap[sortBy] || sortMap.created_at;

    const [purchases, total] = await Promise.all([
      posPurchaseRepository.findMany({ where, skip, take: perPage, orderBy }),
      posPurchaseRepository.count(where),
    ]);

    return {
      data: purchases.map(mapPurchaseListItem),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  },

  async getCreateOptions() {
    const [branches, suppliers, products] = await Promise.all([
      posPurchaseRepository.listActiveBranches(),
      posPurchaseRepository.listActiveSuppliers(),
      posPurchaseRepository.listActiveProducts(),
    ]);

    return {
      branches,
      suppliers,
      products: products.map((product) => ({
        uuid: product.uuid,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        purchase_price: Number(product.purchasePrice || 0),
      })),
    };
  },

  async createPurchase(payload: PurchasePayloadInput & { isDraft?: boolean }, userId: number) {
    const companyUuid = getTenantCompanyUuid();
    if (!companyUuid) {
      throw new ApiError('Konteks perusahaan tidak ditemukan', 500);
    }

    const { branchUuid, supplierUuid, purchaseDate, discountAmount, paidAmount, notes } = payload;
    if (!branchUuid || !supplierUuid || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new ValidationApiError({ items: ['Cabang, supplier, dan item wajib diisi'] });
    }

    const items = normalizeItems(payload.items);
    const totals = computeTotals({
      items,
      discountAmount,
      paidAmount,
      forceDraft: Boolean(payload.isDraft),
    });

    const parsedPurchaseDate = parsePurchaseDate(purchaseDate);
    const purchaseNumber = generatePurchaseNumber();

    const purchaseUuid = await posPurchaseRepository.runInTransaction(async (tx) => {
      await assertPurchaseReferencesExist(tx, { branchUuid, supplierUuid, items });

      const createdPurchase = await tx.posPurchase.create({
        data: {
          companyUuid,
          purchaseNumber,
          branchUuid,
          supplierUuid,
          purchaseDate: parsedPurchaseDate,
          subtotal: totals.subtotal,
          discountAmount: totals.totalDiscount,
          totalAmount: totals.totalAmount,
          paidAmount: totals.finalPaidAmount,
          paymentStatus: totals.paymentStatus,
          notes: notes?.trim() || null,
          createdBy: userId,
        },
      });

      for (const item of items) {
        await tx.posPurchaseItem.create({
          data: {
            purchaseUuid: createdPurchase.uuid,
            productUuid: item.productUuid,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal: item.quantity * item.unitPrice - item.discount,
          },
        });
      }

      if (!payload.isDraft) {
        await applyStockInForItems(tx, {
          companyUuid,
          branchUuid,
          purchaseUuid: createdPurchase.uuid,
          purchaseNumber,
          userId,
          items,
        });
      }

      return createdPurchase.uuid;
    });

    const created = await posPurchaseRepository.findByUuid(purchaseUuid);
    if (!created) {
      throw new ApiError('Purchase not found', 404);
    }

    return mapPurchaseDetail(created);
  },

  async updateDraftPurchase(
    uuid: string,
    payload: PurchasePayloadInput & { finalize?: boolean },
    userId: number
  ) {
    const companyUuid = getTenantCompanyUuid();
    if (!companyUuid) {
      throw new ApiError('Konteks perusahaan tidak ditemukan', 500);
    }

    const existingPurchase = await posPurchaseRepository.findByUuidWithItems(uuid);
    if (!existingPurchase) {
      throw new ApiError('Purchase not found', 404);
    }
    if (existingPurchase.paymentStatus !== 'draft') {
      throw new ApiError('Hanya pembelian draft yang bisa diedit', 400);
    }

    const { branchUuid, supplierUuid, purchaseDate, discountAmount, paidAmount, notes } = payload;
    if (!branchUuid || !supplierUuid || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new ValidationApiError({ items: ['Cabang, supplier, dan item wajib diisi'] });
    }

    const items = normalizeItems(payload.items);
    const finalize = Boolean(payload.finalize);
    const totals = computeTotals({
      items,
      discountAmount,
      paidAmount,
      forceDraft: !finalize,
    });
    const parsedPurchaseDate = parsePurchaseDate(purchaseDate);

    await posPurchaseRepository.runInTransaction(async (tx) => {
      await assertPurchaseReferencesExist(tx, { branchUuid, supplierUuid, items });

      await tx.posPurchase.update({
        where: { uuid },
        data: {
          branchUuid,
          supplierUuid,
          purchaseDate: parsedPurchaseDate,
          subtotal: totals.subtotal,
          discountAmount: totals.totalDiscount,
          totalAmount: totals.totalAmount,
          paidAmount: totals.finalPaidAmount,
          paymentStatus: totals.paymentStatus,
          notes: notes?.trim() || null,
        },
      });

      await tx.posPurchaseItem.deleteMany({ where: { purchaseUuid: uuid } });

      for (const item of items) {
        await tx.posPurchaseItem.create({
          data: {
            purchaseUuid: uuid,
            productUuid: item.productUuid,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal: item.quantity * item.unitPrice - item.discount,
          },
        });
      }

      if (finalize) {
        await applyStockInForItems(tx, {
          companyUuid,
          branchUuid,
          purchaseUuid: uuid,
          purchaseNumber: existingPurchase.purchaseNumber,
          userId,
          items,
        });
      }
    });

    const updated = await posPurchaseRepository.findByUuid(uuid);
    if (!updated) {
      throw new ApiError('Purchase not found', 404);
    }

    return mapPurchaseDetail(updated);
  },

  async getPurchaseDetail(uuid: string) {
    const purchase = await posPurchaseRepository.findByUuid(uuid);
    if (!purchase) {
      throw new ApiError('Purchase not found', 404);
    }

    return mapPurchaseDetail(purchase);
  },

  async voidPurchase(uuid: string, userId: number) {
    const companyUuid = getTenantCompanyUuid();
    if (!companyUuid) {
      throw new ApiError('Konteks perusahaan tidak ditemukan', 500);
    }

    const purchase = await posPurchaseRepository.findByUuidWithItems(uuid);
    if (!purchase) {
      throw new ApiError('Purchase not found', 404);
    }

    if (purchase.paymentStatus === 'void') {
      throw new ApiError('Pembelian sudah void', 400);
    }

    await posPurchaseRepository.runInTransaction(async (tx) => {
      if (purchase.paymentStatus !== 'draft') {
        for (const item of purchase.items) {
          const stock = await tx.posProductStock.findFirst({
            where: {
              productUuid: item.productUuid,
              branchUuid: purchase.branchUuid,
            },
          });

          const productLabel = item.product?.name || item.product?.sku || item.productUuid;
          if (!stock) {
            throw new ApiError(`Stok produk ${productLabel} tidak ditemukan di cabang ini`, 400);
          }

          const quantityBefore = Number(stock.stock);
          if (quantityBefore < item.quantity) {
            throw new ApiError(
              `Gagal void pembelian: stok produk ${productLabel} akan menjadi negatif (stok saat ini ${quantityBefore}, rollback ${item.quantity})`,
              400
            );
          }

          const quantityAfter = quantityBefore - item.quantity;

          await tx.posProductStock.update({
            where: { uuid: stock.uuid },
            data: { stock: quantityAfter },
          });

          await tx.posStockMovement.create({
            data: {
              companyUuid,
              productUuid: item.productUuid,
              branchUuid: purchase.branchUuid,
              movementType: 'purchase',
              quantity: -item.quantity,
              previousStock: quantityBefore,
              newStock: quantityAfter,
              referenceType: 'PurchaseVoid',
              referenceUuid: purchase.uuid,
              notes: `Purchase void: ${purchase.purchaseNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      await tx.posPurchase.update({
        where: { uuid },
        data: {
          paymentStatus: 'void',
          notes: purchase.notes
            ? `${purchase.notes}\n[VOID] Dokumen di-void pada ${new Date().toISOString()}`
            : `[VOID] Dokumen di-void pada ${new Date().toISOString()}`,
        },
      });
    });
  },

  async deletePurchase(uuid: string, userId: number) {
    await this.voidPurchase(uuid, userId);
  },
};
