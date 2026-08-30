import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { openShiftSchema } from '@/lib/validations/shift';
import { posShiftService } from '@/lib/modules/pos/shifts/admin.service';

export const GET = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort_by') || 'opened_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posShiftService.listShifts({
      page,
      perPage,
      search,
      branchUuid,
      status,
      sortBy,
      sortOrder,
      userId: context.userId,
      companyUuid: context.companyUuid,
    });

    return successResponse('Cashier shifts retrieved successfully', result);
  })
);

export const POST = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const body = await req.json();
    const result = validateSchema(openShiftSchema, body);
    if (!('data' in result)) return result;

    const shift = await posShiftService.openShift(
      {
        branchUuid: result.data.branch_uuid,
        notesOpen: result.data.notes_open || null,
        actualBalances: result.data.actual_balances,
      },
      context.userId
    );

    return successResponse('Shift opened successfully', shift, 201);
  })
);
