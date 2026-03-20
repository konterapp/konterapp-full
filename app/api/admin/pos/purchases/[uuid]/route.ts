import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posPurchaseService } from '@/lib/modules/pos/purchases/admin.service';

export const DELETE = withPermission(
  'admin.pos.purchase.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posPurchaseService.deletePurchase(uuid, context.userId);
    return successResponse('Purchase deleted successfully', null);
  })
);
