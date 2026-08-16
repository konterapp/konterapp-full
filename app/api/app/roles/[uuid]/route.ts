import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateRoleSchema } from '@/lib/validations/role';
import { appRoleService } from '@/lib/modules/roles/admin.service';

export const GET = withPermission(
  'role.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const role = await appRoleService.getRoleDetail(context.companyUuid, uuid);
    return successResponse('Role retrieved successfully', role);
  })
);

export const PATCH = withPermission(
  'role.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const body = await req.json();
    const result = validateSchema(updateRoleSchema, body);
    if (!('data' in result)) return result;

    const role = await appRoleService.updateRole(context.companyUuid, uuid, result.data);
    return successResponse('Role updated successfully', role);
  })
);

export const PUT = PATCH;

export const DELETE = withPermission(
  'role.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await appRoleService.deleteRole(context.companyUuid, uuid);
    return successResponse('Role deleted successfully', null);
  })
);
