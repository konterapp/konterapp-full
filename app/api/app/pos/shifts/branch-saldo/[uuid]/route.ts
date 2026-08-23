import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posShiftService } from '@/lib/modules/pos/shifts/admin.service';

export const GET = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const result = await posShiftService.getBranchSaldoForShift(uuid, context.userId);
    return successResponse('Saldo cabang berhasil dimuat', result);
  })
);
