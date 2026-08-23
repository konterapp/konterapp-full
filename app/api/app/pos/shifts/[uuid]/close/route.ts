import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { closeShiftSchema } from '@/lib/validations/shift';
import { posShiftService } from '@/lib/modules/pos/shifts/admin.service';

export const POST = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const body = await req.json();
    const result = validateSchema(closeShiftSchema, body);
    if (!('data' in result)) return result;

    const shift = await posShiftService.closeShift(
      uuid,
      {
        notesClose: result.data.notes_close || null,
      },
      context.userId
    );

    return successResponse('Shift closed successfully', shift);
  })
);
