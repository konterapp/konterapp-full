import { Prisma } from '@prisma/client';
import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { getTenantCompanyUuid } from '@/lib/tenant-context';
import { posPurchaseRepository } from './repository';
import { mapPurchaseDetail, mapPurchaseListItem } from './purchase.mapper';
import type { TransactionClient } from "@/lib/prisma";

type PurchaseItemInput = {
  productUuid: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

type PurchasePayloadInput = {
  branchUuid: string;
  supplierUuid?: string | null;
  purchaseDate?: string | null;
  discountAmount?: number;
  paidAmount?: number;
  notes?: string | null;
  items: PurchaseItemInput[];
};

type NormalizedPurchaseItem = {
  productUuid: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

type ResolvedPurchaseItem = NormalizedPurchaseItem & {
  purchaseUnit: string;
  factorToBase: number;
  quantityBase: number;
};

function normalizeUnitValue(value: string) {
  return value.trim().toLowerCase();
}

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

    const unit = String(item.unit || '').trim();
    if (!unit) {
      throw new ValidationApiError({ items: ['Satuan item wajib dipilih'] });
    }

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
      unit,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount,
    };
  });
}

function computeTotals(args: {
  items: NormalizedPurchaseItem[];
  discountAmount?: number;
  paidAmount?: number;
  forceDraft: boolean;
  forcePaid: boolean;
}) {
  const { items, discountAmount, paidAmount, forceDraft, forcePaid } = args;

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

  const finalPaidAmount = forceDraft ? 0 : forcePaid ? totalAmount : requestedPaidAmount;
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
  tx: TransactionClient,
  params: {
    branchUuid: string;
    supplierUuid?: string | null;
    items: NormalizedPurchaseItem[];
  }
) {
  const { branchUuid, supplierUuid, items } = params;

  const [branch, supplier, products] = await Promise.all([
    tx.appPosBranch.findFirst({ where: { uuid: branchUuid, isActive: true } }),
    supplierUuid ? tx.appPosSupplier.findFirst({ where: { uuid: supplierUuid, isActive: true } }) : Promise.resolve(null),
    tx.appPosProduct.findMany({
      where: {
        uuid: { in: items.map((item) => item.productUuid) },
        isActive: true,
      },
      select: {
        uuid: true,
        name: true,
        sku: true,
        unit: true,
        unitConversions: {
          where: { isActive: true },
          select: {
            unit: true,
            factorToBase: true,
            isActive: true,
          },
        },
      },
    }),
  ]);

  if (!branch) {
    throw new ApiError('Cabang tidak ditemukan atau tidak aktif', 404);
  }
  if (supplierUuid && !supplier) {
    throw new ApiError('Supplier tidak ditemukan atau tidak aktif', 404);
  }
  if (products.length !== items.length) {
    throw new ValidationApiError({ items: ['Sebagian produk tidak ditemukan atau tidak aktif'] });
  }

  return { products };
}

function resolveItemsWithConversion(params: {
  items: NormalizedPurchaseItem[];
  products: Array<{
    uuid: string;
    name: string;
    sku: string;
    unit: string;
    unitConversions: Array<{
      unit: string;
      factorToBase: Prisma.Decimal;
      isActive: boolean;
    }>;
  }>;
}) {
  const { items, products } = params;

  const productMap = new Map(products.map((product) => [product.uuid, product]));

  return items.map<ResolvedPurchaseItem>((item) => {
    const product = productMap.get(item.productUuid);
    if (!product) {
      throw new ValidationApiError({ items: ['Produk pada item pembelian tidak valid'] });
    }

    const requestedUnitKey = normalizeUnitValue(item.unit);
    const baseUnitKey = normalizeUnitValue(product.unit);

    let purchaseUnit = product.unit;
    let factorToBase = 1;

    if (requestedUnitKey !== baseUnitKey) {
      const conversion = product.unitConversions.find(
        (row) => normalizeUnitValue(row.unit) === requestedUnitKey && row.isActive
      );

      if (!conversion) {
        throw new ValidationApiError({
          items: [`Satuan ${item.unit} tidak tersedia untuk produk ${product.name}`],
        });
      }

      const parsedFactor = Number(conversion.factorToBase);
      if (!Number.isFinite(parsedFactor) || parsedFactor <= 0) {
        throw new ValidationApiError({
          items: [`Konversi satuan produk ${product.name} tidak valid`],
        });
      }

      purchaseUnit = conversion.unit;
      factorToBase = parsedFactor;
    }

    const quantityBaseRaw = item.quantity * factorToBase;
    const quantityBaseRounded = Math.round(quantityBaseRaw);

    if (Math.abs(quantityBaseRaw - quantityBaseRounded) > 1e-9) {
      throw new ValidationApiError({
        items: [`Konversi qty produk ${product.name} menghasilkan stok pecahan. Periksa qty atau faktor satuan.`],
      });
    }

    return {
      ...item,
      purchaseUnit,
      factorToBase,
      quantityBase: quantityBaseRounded,
    };
  });
}

async function applyStockInForItems(
  tx: TransactionClient,
  params: {
    companyUuid: string;
    branchUuid: string;
    purchaseUuid: string;
    purchaseNumber: string;
    userId: number;
    items: ResolvedPurchaseItem[];
  }
) {
  const { companyUuid, branchUuid, purchaseUuid, purchaseNumber, userId, items } = params;

  for (const item of items) {
    const stock = await tx.appPosProductStock.findFirst({
      where: {
        companyUuid,
        productUuid: item.productUuid,
        branchUuid,
      },
    });

    const previousStock = Number(stock?.stock ?? 0);
    const newStock = previousStock + item.quantityBase;

    if (stock) {
      await tx.appPosProductStock.update({
        where: { uuid: stock.uuid },
        data: { stock: newStock },
      });
    } else {
      await tx.appPosProductStock.create({
        data: {
          companyUuid,
          productUuid: item.productUuid,
          branchUuid,
          stock: newStock,
        },
      });
    }

    await tx.appPosStockMovement.create({
      data: {
        companyUuid,
        branchUuid,
        productUuid: item.productUuid,
        movementType: 'purchase',
        quantity: item.quantityBase,
        previousStock,
        newStock,
        referenceType: 'Purchase',
        referenceUuid: purchaseUuid,
        notes: `Purchase: ${purchaseNumber} (${item.quantity} ${item.purchaseUnit})`,
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

    const where: Prisma.AppPosPurchaseWhereInput = {};
    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (branchUuid) where.branchUuid = branchUuid;
    if (supplierUuid) where.supplierUuid = supplierUuid;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const sortMap: Record<string, Prisma.AppPosPurchaseOrderByWithRelationInput> = {
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
      products: products.map((product) => {
        const baseUnitKey = normalizeUnitValue(product.unit);
        const unitMap = new Map<string, { unit: string; factor_to_base: number; is_base: boolean }>();

        unitMap.set(baseUnitKey, {
          unit: product.unit,
          factor_to_base: 1,
          is_base: true,
        });

        for (const conversion of product.unitConversions) {
          const factor = Number(conversion.factorToBase);
          if (!Number.isFinite(factor) || factor <= 0) continue;

          const key = normalizeUnitValue(conversion.unit);
          if (!unitMap.has(key)) {
            unitMap.set(key, {
              unit: conversion.unit,
              factor_to_base: factor,
              is_base: false,
            });
          }
        }

        const purchaseUnits = Array.from(unitMap.values()).sort((a, b) => {
          if (a.is_base) return -1;
          if (b.is_base) return 1;
          return a.factor_to_base - b.factor_to_base;
        });

        return {
          uuid: product.uuid,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          purchase_price: Number(product.purchasePrice || 0),
          purchase_units: purchaseUnits,
        };
      }),
    };
  },

  async createPurchase(payload: PurchasePayloadInput & { isDraft?: boolean }, userId: number) {
    const companyUuid = getTenantCompanyUuid();
    if (!companyUuid) {
      throw new ApiError('Konteks perusahaan tidak ditemukan', 500);
    }

    const { branchUuid, supplierUuid, purchaseDate, discountAmount, paidAmount, notes } = payload;
    if (!branchUuid || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new ValidationApiError({ items: ['Cabang dan item wajib diisi'] });
    }
    const normalizedSupplierUuid = typeof supplierUuid === 'string' && supplierUuid.trim() ? supplierUuid.trim() : null;
    const isDraft = Boolean(payload.isDraft);
    const forcePaid = !isDraft && !normalizedSupplierUuid;

    const items = normalizeItems(payload.items);
    const totals = computeTotals({
      items,
      discountAmount,
      paidAmount,
      forceDraft: isDraft,
      forcePaid,
    });

    const parsedPurchaseDate = parsePurchaseDate(purchaseDate);
    const purchaseNumber = generatePurchaseNumber();

    const purchaseUuid = await posPurchaseRepository.runInTransaction(async (tx) => {
      const refs = await assertPurchaseReferencesExist(tx, {
        branchUuid,
        supplierUuid: normalizedSupplierUuid,
        items,
      });
      const resolvedItems = resolveItemsWithConversion({ items, products: refs.products });

      const createdPurchase = await tx.appPosPurchase.create({
        data: {
          companyUuid,
          purchaseNumber,
          branchUuid,
          supplierUuid: normalizedSupplierUuid,
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

      for (const item of resolvedItems) {
        await tx.appPosPurchaseItem.create({
          data: {
            companyUuid,
            purchaseUuid: createdPurchase.uuid,
            productUuid: item.productUuid,
            quantity: item.quantity,
            purchaseUnit: item.purchaseUnit,
            factorToBase: item.factorToBase,
            quantityBase: item.quantityBase,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal: item.quantity * item.unitPrice - item.discount,
          },
        });
      }

      if (!isDraft) {
        await applyStockInForItems(tx, {
          companyUuid,
          branchUuid,
          purchaseUuid: createdPurchase.uuid,
          purchaseNumber,
          userId,
          items: resolvedItems,
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
    if (!branchUuid || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new ValidationApiError({ items: ['Cabang dan item wajib diisi'] });
    }
    const normalizedSupplierUuid = typeof supplierUuid === 'string' && supplierUuid.trim() ? supplierUuid.trim() : null;

    const items = normalizeItems(payload.items);
    const finalize = Boolean(payload.finalize);
    const forcePaid = finalize && !normalizedSupplierUuid;
    const totals = computeTotals({
      items,
      discountAmount,
      paidAmount,
      forceDraft: !finalize,
      forcePaid,
    });
    const parsedPurchaseDate = parsePurchaseDate(purchaseDate);

    await posPurchaseRepository.runInTransaction(async (tx) => {
      const refs = await assertPurchaseReferencesExist(tx, {
        branchUuid,
        supplierUuid: normalizedSupplierUuid,
        items,
      });
      const resolvedItems = resolveItemsWithConversion({ items, products: refs.products });

      await tx.appPosPurchase.update({
        where: { uuid },
        data: {
          branchUuid,
          supplierUuid: normalizedSupplierUuid,
          purchaseDate: parsedPurchaseDate,
          subtotal: totals.subtotal,
          discountAmount: totals.totalDiscount,
          totalAmount: totals.totalAmount,
          paidAmount: totals.finalPaidAmount,
          paymentStatus: totals.paymentStatus,
          notes: notes?.trim() || null,
        },
      });

      await tx.appPosPurchaseItem.deleteMany({ where: { purchaseUuid: uuid } });

      for (const item of resolvedItems) {
        await tx.appPosPurchaseItem.create({
          data: {
            companyUuid,
            purchaseUuid: uuid,
            productUuid: item.productUuid,
            quantity: item.quantity,
            purchaseUnit: item.purchaseUnit,
            factorToBase: item.factorToBase,
            quantityBase: item.quantityBase,
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
          items: resolvedItems,
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
          const stock = await tx.appPosProductStock.findFirst({
            where: {
              companyUuid,
              productUuid: item.productUuid,
              branchUuid: purchase.branchUuid,
            },
          });

          const productLabel = item.product?.name || item.product?.sku || item.productUuid;
          if (!stock) {
            throw new ApiError(`Stok produk ${productLabel} tidak ditemukan di cabang ini`, 400);
          }

          const quantityRollback = Number(item.quantityBase || item.quantity || 0);
          const quantityBefore = Number(stock.stock);
          if (quantityBefore < quantityRollback) {
            throw new ApiError(
              `Gagal void pembelian: stok produk ${productLabel} akan menjadi negatif (stok saat ini ${quantityBefore}, rollback ${quantityRollback})`,
              400
            );
          }

          const quantityAfter = quantityBefore - quantityRollback;

          await tx.appPosProductStock.update({
            where: { uuid: stock.uuid },
            data: { stock: quantityAfter },
          });

          await tx.appPosStockMovement.create({
            data: {
              companyUuid,
              productUuid: item.productUuid,
              branchUuid: purchase.branchUuid,
              movementType: 'purchase',
              quantity: -quantityRollback,
              previousStock: quantityBefore,
              newStock: quantityAfter,
              referenceType: 'PurchaseVoid',
              referenceUuid: purchase.uuid,
              notes: `Purchase void: ${purchase.purchaseNumber} (${item.quantity} ${item.purchaseUnit})`,
              createdBy: userId,
            },
          });
        }
      }

      await tx.appPosPurchase.update({
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
