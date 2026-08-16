import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posProductService } from '@/lib/modules/pos/products/admin.service';

export const GET = withPermission(
  'admin.pos.sale.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid');
    const sortBy = searchParams.get('sort_by') || 'name';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? 'desc' : 'asc';

    const result = await posProductService.listProducts({
      page,
      perPage,
      search,
      categoryUuid: null,
      branchUuid,
      isActive: 'true',
      inStockOnly: null,
      sortBy,
      sortOrder,
    });

    return successResponse('Price check products retrieved successfully', result);
  })
);
