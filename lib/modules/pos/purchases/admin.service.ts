import { ApiError, ValidationApiError } from '@/lib/api-errors';
import { Prisma } from '@prisma/client';
import { getTenantCompanyUuid } from '@/lib/tenant-context';
import { posPurchaseRepository } from './repository';
import { mapPurchaseDetail, mapPurchaseListItem } from './purchase.mapper';

function generatePurchaseNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `PO-${year}${month}${day}-${random}`;
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

  async createPurchase(
    payload: {
      branchUuid: string;
      supplierUuid: string;
      purchaseDate?: string | null;
      discountAmount?: number;
      paidAmount?: number;
      notes?: string | null;
      items: Array<{
        productUuid: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
      }>;
    },
    userId: number
  ) {
    const companyUuid = getTenantCompanyUuid();
    if (!companyUuid) {
      throw new ApiError('Konteks perusahaan tidak ditemukan', 500);
    }

    const { branchUuid, supplierUuid, purchaseDate, discountAmount, paidAmount, notes, items } = payload;

    if (!branchUuid || !supplierUuid || !Array.isArray(items) || items.length === 0) {
      throw new ValidationApiError({ items: ['Cabang, supplier, dan item wajib diisi'] });
    }

    const seenProducts = new Set<string>();
    let subtotal = 0;
    let itemDiscountTotal = 0;

    for (const item of items) {
      if (seenProducts.has(item.productUuid)) {
        throw new ValidationApiError({ items: ['Produk pada pembelian tidak boleh duplikat'] });
      }
      seenProducts.add(item.productUuid);

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new ValidationApiError({ items: ['Qty item harus bilangan bulat dan lebih dari 0'] });
      }

      if (Number.isNaN(item.unitPrice) || item.unitPrice < 0) {
        throw new ValidationApiError({ items: ['Harga beli item tidak valid'] });
      }

      const itemDiscount = Number(item.discount || 0);
      const maxDiscount = item.quantity * item.unitPrice;
      if (itemDiscount < 0 || itemDiscount > maxDiscount) {
        throw new ValidationApiError({ items: ['Diskon item tidak boleh negatif atau melebihi subtotal item'] });
      }

      subtotal += item.quantity * item.unitPrice;
      itemDiscountTotal += itemDiscount;
    }

    const globalDiscount = Number(discountAmount || 0);
    if (globalDiscount < 0) {
      throw new ValidationApiError({ discount_amount: ['Diskon tidak boleh negatif'] });
    }

    const totalDiscount = itemDiscountTotal + globalDiscount;
    const totalAmount = subtotal - totalDiscount;
    if (totalAmount <= 0) {
      throw new ValidationApiError({ discount_amount: ['Total pembelian harus lebih dari 0'] });
    }

    const finalPaidAmount = Number(paidAmount || 0);
    if (Number.isNaN(finalPaidAmount) || finalPaidAmount < 0) {
      throw new ValidationApiError({ paid_amount: ['Nominal bayar tidak valid'] });
    }
    if (finalPaidAmount > totalAmount) {
      throw new ValidationApiError({ paid_amount: ['Nominal bayar tidak boleh melebihi total pembelian'] });
    }

    const paymentStatus = finalPaidAmount <= 0 ? 'pending' : finalPaidAmount < totalAmount ? 'partial' : 'paid';

    const parsedPurchaseDate = purchaseDate ? new Date(purchaseDate) : new Date();
    if (Number.isNaN(parsedPurchaseDate.getTime())) {
      throw new ValidationApiError({ purchase_date: ['Tanggal pembelian tidak valid'] });
    }

    const purchaseNumber = generatePurchaseNumber();

    const purchaseUuid = await posPurchaseRepository.runInTransaction(async (tx: Prisma.TransactionClient) => {
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

      const createdPurchase = await tx.posPurchase.create({
        data: {
          companyUuid,
          purchaseNumber,
          branchUuid,
          supplierUuid,
          purchaseDate: parsedPurchaseDate,
          subtotal,
          discountAmount: totalDiscount,
          totalAmount,
          paidAmount: finalPaidAmount,
          paymentStatus,
          notes: notes?.trim() || null,
          createdBy: userId,
        },
      });

      for (const item of items) {
        const itemDiscount = Number(item.discount || 0);
        const itemSubtotal = item.quantity * item.unitPrice - itemDiscount;

        await tx.posPurchaseItem.create({
          data: {
            purchaseUuid: createdPurchase.uuid,
            productUuid: item.productUuid,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: itemDiscount,
            subtotal: itemSubtotal,
          },
        });

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
            referenceUuid: createdPurchase.uuid,
            notes: `Purchase: ${purchaseNumber}`,
            createdBy: userId,
          },
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

  async getPurchaseDetail(uuid: string) {
    const purchase = await posPurchaseRepository.findByUuid(uuid);
    if (!purchase) {
      throw new ApiError('Purchase not found', 404);
    }

    return mapPurchaseDetail(purchase);
  },

  async deletePurchase(uuid: string, userId: number) {
    const companyUuid = getTenantCompanyUuid();
    if (!companyUuid) {
      throw new ApiError('Konteks perusahaan tidak ditemukan', 500);
    }

    const purchase = await posPurchaseRepository.findByUuidWithItems(uuid);
    if (!purchase) {
      throw new ApiError('Purchase not found', 404);
    }

    await posPurchaseRepository.runInTransaction(async (tx: Prisma.TransactionClient) => {
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

        const quantityBefore = stock.stock;
        if (quantityBefore < item.quantity) {
          throw new ApiError(
            `Gagal hapus pembelian: stok produk ${productLabel} akan menjadi negatif (stok saat ini ${quantityBefore}, rollback ${item.quantity})`,
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
            referenceType: 'Purchase',
            referenceUuid: purchase.uuid,
            notes: `Purchase deleted: ${purchase.purchaseNumber}`,
            createdBy: userId,
          },
        });
      }

      await tx.posPurchase.delete({ where: { uuid } });
    });
  },
};
