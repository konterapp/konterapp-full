import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateBranchSchema } from '@/lib/validations/branch';
import { posBranchService } from '@/lib/modules/pos/branches/admin.service';

export const GET = withPermission(
  'pos.branch.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const branch = await posBranchService.getBranchDetail(uuid);

    return successResponse('Branch retrieved successfully', branch);
  })
);

export const PUT = withPermission(
  'pos.branch.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      isActive: rawBody.isActive ?? rawBody.is_active,
      isMain: rawBody.isMain ?? rawBody.is_main,
      maxConcurrentUsers: rawBody.maxConcurrentUsers ?? rawBody.max_concurrent_users,
    };

    const result = validateSchema(updateBranchSchema, body);
    if (!('data' in result)) return result;

    const branch = await posBranchService.updateBranch(uuid, context.companyUuid, result.data);
    return successResponse('Branch updated successfully', branch);
  })
);

export const DELETE = withPermission(
  'pos.branch.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;

    await posBranchService.deleteBranch(uuid);
    return successResponse('Branch deleted successfully', null);
  })
);
