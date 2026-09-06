import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createStockTransferSchema } from '@/lib/validations/stock-transfer';
import { posStockTransferService } from '@/lib/modules/pos/stock-transfers/admin.service';

export const GET = withPermission(
  'pos.stock-transfer.index',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'history';

    if (scope === 'form') {
      const fromBranchUuid = searchParams.get('from_branch_uuid');
      const result = await posStockTransferService.getCreateOptions(context.companyUuid, context.userId, fromBranchUuid);
      return successResponse('Stock transfer form options retrieved successfully', result);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const fromBranchUuid = searchParams.get('from_branch_uuid') || '';
    const toBranchUuid = searchParams.get('to_branch_uuid') || '';
    const productUuid = searchParams.get('product_uuid') || '';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posStockTransferService.listTransferHistory({
      page,
      perPage,
      search,
      fromBranchUuid,
      toBranchUuid,
      productUuid,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      companyUuid: context.companyUuid,
      userId: context.userId,
    });
    return successResponse('Stock transfer history retrieved successfully', result);
  })
);

export const POST = withPermission(
  'pos.stock-transfer.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const body = await req.json();
    const result = validateSchema(createStockTransferSchema, body);
    if (!('data' in result)) return result;

    const transfer = await posStockTransferService.createTransfer(
      {
        fromBranchUuid: result.data.from_branch_uuid,
        toBranchUuid: result.data.to_branch_uuid,
        notes: result.data.notes || null,
        items: result.data.items.map((item) => ({
          productUuid: item.product_uuid,
          quantity: Number(item.quantity),
        })),
      },
      context.userId
    );

    return successResponse('Stock transfer saved successfully', transfer, 201);
  })
);
