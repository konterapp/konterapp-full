import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';

export const GET = withPermission(
  'pos.branch.index',
  withApiErrorHandling(async (_req: NextRequest) => {
    const branches = await posBranchService.listBranchesSimple();
    return successResponse('Branches retrieved successfully', branches);
  })
);
