import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { appUserService } from '@/lib/modules/users/app.admin.service';

export const GET = withPermission(
  'user.index',
  withApiErrorHandling(async (_req, context) => {
    const branches = await appUserService.getBranches(context.companyUuid);
    return successResponse('Branches retrieved successfully', branches);
  })
);
