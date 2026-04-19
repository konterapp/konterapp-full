import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createPurchaseSchema } from '@/lib/validations/purchase';
import { posPurchaseService } from '@/lib/modules/pos/purchases/admin.service';

export const GET = withPermission(
  'admin.pos.purchase.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';
    const branchUuid = searchParams.get('branch_uuid') || '';
    const supplierUuid = searchParams.get('supplier_uuid') || '';
    const paymentStatus = searchParams.get('payment_status') || '';

    const result = await posPurchaseService.listPurchases({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
      branchUuid,
      supplierUuid,
      paymentStatus,
    });

    return successResponse('Purchases retrieved successfully', result);
  })
);

export const POST = withPermission(
  'admin.pos.purchase.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const rawBody = (await req.json()) as Record<string, unknown>;
    const body = {
      ...rawBody,
      branch_uuid: rawBody.branch_uuid ?? rawBody.branchUuid,
      supplier_uuid: rawBody.supplier_uuid ?? rawBody.supplierUuid,
      purchase_date: rawBody.purchase_date ?? rawBody.purchaseDate,
      discount_amount: rawBody.discount_amount ?? rawBody.discountAmount ?? 0,
      paid_amount: rawBody.paid_amount ?? rawBody.paidAmount ?? 0,
      is_draft: rawBody.is_draft ?? rawBody.isDraft ?? false,
      items: Array.isArray(rawBody.items)
        ? rawBody.items.map((item) => {
            const itemRow = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
            return {
              product_uuid: itemRow.product_uuid ?? itemRow.productUuid,
              quantity: itemRow.quantity,
              unit_price: itemRow.unit_price ?? itemRow.unitPrice,
              discount: itemRow.discount ?? 0,
            };
          })
        : rawBody.items,
    };

    const result = validateSchema(createPurchaseSchema, body);
    if (!('data' in result)) return result;

    const purchase = await posPurchaseService.createPurchase(
      {
        branchUuid: result.data.branch_uuid,
        supplierUuid: result.data.supplier_uuid,
        purchaseDate: result.data.purchase_date || null,
        discountAmount: Number(result.data.discount_amount || 0),
        paidAmount: Number(result.data.paid_amount || 0),
        isDraft: Boolean(result.data.is_draft),
        notes: result.data.notes || null,
        items: result.data.items.map((item) => ({
          productUuid: item.product_uuid,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unit_price),
          discount: Number(item.discount || 0),
        })),
      },
      context.userId
    );

    return successResponse('Purchase created successfully', purchase, 201);
  })
);
