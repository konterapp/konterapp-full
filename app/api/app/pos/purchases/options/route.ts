import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posPurchaseService } from '@/lib/modules/pos/purchases/admin.service';

export const GET = withPermission(
  'admin.pos.purchase.create',
  withApiErrorHandling(async () => {
    const result = await posPurchaseService.getCreateOptions();
    return successResponse('Purchase form options retrieved successfully', result);
  })
);
