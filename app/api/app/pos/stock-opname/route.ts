import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createStockOpnameSchema } from '@/lib/validations/stock-opname';
import { posStockOpnameService } from '@/lib/modules/pos/stock-opname/admin.service';

export const GET = withPermission(
  'pos.stock-movement.index',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'history';

    if (scope === 'form') {
      const branchUuid = searchParams.get('branch_uuid');
      const result = await posStockOpnameService.getCreateOptions(context.companyUuid, context.userId, branchUuid);
      return successResponse('Stock opname form options retrieved successfully', result);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid') || '';
    const productUuid = searchParams.get('product_uuid') || '';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posStockOpnameService.listOpnameHistory({
      page,
      perPage,
      search,
      branchUuid,
      productUuid,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      companyUuid: context.companyUuid,
      userId: context.userId,
    });
    return successResponse('Stock opname history retrieved successfully', result);
  })
);

export const POST = withPermission(
  'pos.stock-movement.index',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const body = await req.json();
    const result = validateSchema(createStockOpnameSchema, body);
    if (!('data' in result)) return result;

    const opname = await posStockOpnameService.createOpname(
      {
        branchUuid: result.data.branch_uuid,
        notes: result.data.notes || null,
        items: result.data.items.map((item) => ({
          productUuid: item.product_uuid,
          actualStock: item.actual_stock,
        })),
      },
      context.userId
    );

    return successResponse('Stock opname saved successfully', opname, 201);
  })
);
