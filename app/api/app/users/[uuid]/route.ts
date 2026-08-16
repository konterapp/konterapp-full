import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateAppUserSchema } from '@/lib/validations/tenant-user';
import { appUserService } from '@/lib/modules/users/app.admin.service';

export const GET = withPermission(
  'user.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const user = await appUserService.getUserDetail(context.companyUuid, uuid);
    return successResponse('User retrieved successfully', user);
  })
);

export const PATCH = withPermission(
  'user.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const body = await req.json();
    const result = validateSchema(updateAppUserSchema, body);
    if (!('data' in result)) return result;

    const user = await appUserService.updateUser(context.companyUuid, uuid, result.data, context.userId);
    return successResponse('User updated successfully', user);
  })
);

export const PUT = PATCH;

export const DELETE = withPermission(
  'user.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await appUserService.deleteUser(context.companyUuid, uuid, context.userId);
    return successResponse('User deleted successfully', null);
  })
);
