import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withTenant } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';

export const GET = withTenant(
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const branches = await posBranchService.listBranchOptions(context.companyUuid, context.userId);
    return successResponse('Branch options retrieved successfully', branches);
  })
);
