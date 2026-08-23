import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';

export const GET = withPermission(
  'pos.branch.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const result = await posBranchService.getBranchSaldo(uuid);
    return successResponse('Saldo cabang berhasil dimuat', result);
  })
);
