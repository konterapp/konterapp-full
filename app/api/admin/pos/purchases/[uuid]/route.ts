import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateDraftPurchaseSchema } from '@/lib/validations/purchase';
import { posPurchaseService } from '@/lib/modules/pos/purchases/admin.service';

export const GET = withPermission(
  'admin.pos.purchase.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const purchase = await posPurchaseService.getPurchaseDetail(uuid);
    return successResponse('Purchase retrieved successfully', purchase);
  })
);

export const PUT = withPermission(
  'admin.pos.purchase.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = (await req.json()) as Record<string, unknown>;
    const body = {
      ...rawBody,
      branch_uuid: rawBody.branch_uuid ?? rawBody.branchUuid,
      supplier_uuid: rawBody.supplier_uuid ?? rawBody.supplierUuid,
      purchase_date: rawBody.purchase_date ?? rawBody.purchaseDate,
      discount_amount: rawBody.discount_amount ?? rawBody.discountAmount ?? 0,
      paid_amount: rawBody.paid_amount ?? rawBody.paidAmount ?? 0,
      finalize: rawBody.finalize ?? false,
      items: Array.isArray(rawBody.items)
        ? rawBody.items.map((item) => {
            const itemRow = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
            return {
              product_uuid: itemRow.product_uuid ?? itemRow.productUuid,
              unit: itemRow.unit,
              quantity: itemRow.quantity,
              unit_price: itemRow.unit_price ?? itemRow.unitPrice,
              discount: itemRow.discount ?? 0,
            };
          })
        : rawBody.items,
    };

    const result = validateSchema(updateDraftPurchaseSchema, body);
    if (!('data' in result)) return result;

    const purchase = await posPurchaseService.updateDraftPurchase(
      uuid,
      {
        branchUuid: result.data.branch_uuid,
        supplierUuid: result.data.supplier_uuid,
        purchaseDate: result.data.purchase_date || null,
        discountAmount: Number(result.data.discount_amount || 0),
        paidAmount: Number(result.data.paid_amount || 0),
        notes: result.data.notes || null,
        finalize: Boolean(result.data.finalize),
        items: result.data.items.map((item) => ({
          productUuid: item.product_uuid,
          unit: item.unit,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          discount: Number(item.discount || 0),
        })),
      },
      context.userId
    );

    return successResponse('Purchase updated successfully', purchase);
  })
);

export const DELETE = withPermission(
  'admin.pos.purchase.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posPurchaseService.voidPurchase(uuid, context.userId);
    return successResponse('Purchase voided successfully', null);
  })
);
