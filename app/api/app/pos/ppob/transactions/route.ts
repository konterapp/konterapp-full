import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posPpobTransactionService } from '@/lib/modules/pos/ppob-transactions/admin.service';

export const GET = withPermission(
  'admin.pos.ppob.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get('page') || '1');
    const perPage = Number(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const branchUuid = searchParams.get('branch_uuid') || undefined;
    const dateFrom = searchParams.get('date_from') || undefined;
    const dateTo = searchParams.get('date_to') || undefined;

    const result = await posPpobTransactionService.listTransactions({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
      status,
      type,
      branchUuid,
      dateFrom,
      dateTo,
    });

    return successResponse('PPOB transactions retrieved successfully', result);
  })
);
