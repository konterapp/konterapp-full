import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posStockMovementService } from '@/lib/modules/pos/stock-movements/admin.service';

export const GET = withPermission(
  'admin.pos.stock-movement.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';
    const branchUuid = searchParams.get('branch_uuid') || '';
    const productUuid = searchParams.get('product_uuid') || '';
    const movementType = searchParams.get('movement_type') || '';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const result = await posStockMovementService.listStockMovements({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
      branchUuid,
      productUuid,
      movementType,
      dateFrom,
      dateTo,
    });

    return successResponse('Stock movements retrieved successfully', result);
  })
);
