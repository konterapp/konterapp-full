import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateUnitSchema } from '@/lib/validations/unit';
import { posUnitService } from '@/lib/modules/pos/units/admin.service';

export const GET = withPermission(
  'admin.pos.unit.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const unit = await posUnitService.getUnitDetail(uuid);
    return successResponse('Unit retrieved successfully', unit);
  })
);

export const PATCH = withPermission(
  'admin.pos.unit.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const body = await req.json();
    const result = validateSchema(updateUnitSchema, body);
    if (!('data' in result)) return result;

    const unit = await posUnitService.updateUnit(uuid, result.data);
    return successResponse('Unit updated successfully', unit);
  })
);

export const PUT = PATCH;

export const DELETE = withPermission(
  'admin.pos.unit.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posUnitService.deleteUnit(uuid);
    return successResponse('Unit deleted successfully', null);
  })
);
