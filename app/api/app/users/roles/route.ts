import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { appUserService } from '@/lib/modules/users/app.admin.service';

export const GET = withPermission(
  'user.index',
  withApiErrorHandling(async (_req, context) => {
    const roles = await appUserService.getRoles(context.companyUuid);
    return successResponse('Roles retrieved successfully', roles);
  })
);
