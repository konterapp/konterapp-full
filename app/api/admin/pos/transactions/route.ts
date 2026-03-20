import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posTransactionService } from '@/lib/modules/pos/transactions/admin.service';

export const GET = withPermission(
  'admin.pos.sale.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid');
    const paymentMethodUuid = searchParams.get('payment_method_uuid');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const paymentStatus = searchParams.get('payment_status');
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posTransactionService.listTransactions({
      page,
      perPage,
      search,
      branchUuid,
      paymentMethodUuid,
      startDate,
      endDate,
      paymentStatus,
      sortBy,
      sortOrder,
    });

    return successResponse('Transactions retrieved successfully', result);
  })
);

export const POST = withPermission(
  'admin.pos.sale.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const body = await req.json();
    const sale = await posTransactionService.createSale(body, context.userId);
    return successResponse('Sale created successfully', sale);
  })
);
