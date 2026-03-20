import { ApiError } from '@/lib/api-errors';
import { posPurchaseRepository } from './repository';
import { mapPurchaseListItem } from './purchase.mapper';

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

    const where: any = {};
    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (branchUuid) where.branchUuid = branchUuid;
    if (supplierUuid) where.supplierUuid = supplierUuid;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const sortMap: Record<string, any> = {
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

  async deletePurchase(uuid: string, userId: number) {
    const purchase = await posPurchaseRepository.findByUuidWithItems(uuid);
    if (!purchase) {
      throw new ApiError('Purchase not found', 404);
    }

    await posPurchaseRepository.runInTransaction(async (tx: any) => {
      for (const item of purchase.items) {
        const stock = await tx.posProductStock.findFirst({
          where: {
            productUuid: item.productUuid,
            branchUuid: purchase.branchUuid,
          },
        });

        if (!stock) continue;

        const quantityBefore = stock.stock;
        const quantityAfter = quantityBefore - item.quantity;

        await tx.posProductStock.update({
          where: { uuid: stock.uuid },
          data: { stock: quantityAfter },
        });

        await tx.posStockMovement.create({
          data: {
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
