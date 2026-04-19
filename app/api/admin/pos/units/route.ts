import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createUnitSchema } from '@/lib/validations/unit';
import { posUnitService } from '@/lib/modules/pos/units/admin.service';

export const GET = withPermission(
  'admin.pos.unit.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posUnitService.listUnits({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
    });

    return successResponse('Units retrieved successfully', result);
  })
);

export const POST = withPermission(
  'admin.pos.unit.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const body = await req.json();
    const result = validateSchema(createUnitSchema, body);
    if (!('data' in result)) return result;

    const unit = await posUnitService.createUnit(result.data);
    return successResponse('Unit created successfully', unit);
  })
);
