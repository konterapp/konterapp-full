import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
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
