import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posPayableService } from '@/lib/modules/pos/payables/admin.service';

export const GET = withPermission(
  'pos.purchase.index',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid');
    const supplierUuid = searchParams.get('supplier_uuid');
    const paymentStatus = searchParams.get('payment_status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posPayableService.listPayables({
      page,
      perPage,
      search,
      branchUuid,
      supplierUuid,
      paymentStatus,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      companyUuid: context.companyUuid,
      userId: context.userId,
    });

    return successResponse('Payables retrieved successfully', result);
  })
);
