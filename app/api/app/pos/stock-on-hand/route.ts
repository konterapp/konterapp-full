import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posStockOnHandService } from '@/lib/modules/pos/stock-on-hand/admin.service';

export const GET = withPermission(
  'pos.stock-movement.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid') || '';
    const categoryUuid = searchParams.get('category_uuid') || '';
    const stockStatus = searchParams.get('stock_status') || '';
    const sortBy = searchParams.get('sort_by') || 'product_name';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? 'desc' : 'asc';

    const result = await posStockOnHandService.listStockOnHand({
      page,
      perPage,
      search,
      branchUuid,
      categoryUuid,
      stockStatus,
      sortBy,
      sortOrder,
    });

    return successResponse('Stock on-hand retrieved successfully', result);
  })
);
