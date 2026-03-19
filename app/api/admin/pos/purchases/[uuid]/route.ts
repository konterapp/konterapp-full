import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

export const preferredRegion = "sin1";
// DELETE /api/admin/pos/purchases/[uuid] - Delete purchase
export const DELETE = withPermission(
  'admin.pos.purchase.delete',
  async (_req: NextRequest, context) => {
    try {
      const { uuid } = await context.params;
      const { userId } = context;

      const purchase = await prisma.posPurchase.findFirst({
        where: { uuid },
        include: {
          items: true,
        },
      });

      if (!purchase) {
        return errorResponse('Purchase not found', 404);
      }

      await prisma.$transaction(async (tx) => {
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

      return successResponse('Purchase deleted successfully', null);
    } catch (error: any) {
      console.error('Error deleting purchase:', error);
      return errorResponse('Failed to delete purchase', 500);
    }
  }
);