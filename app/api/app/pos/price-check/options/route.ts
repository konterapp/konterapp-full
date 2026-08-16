import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';

export const GET = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async () => {
    const branches = await posBranchService.listBranchesSimple();
    return successResponse('Price check options retrieved successfully', { branches });
  })
);
