import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createRoleSchema } from '@/lib/validations/role';
import { appRoleService } from '@/lib/modules/roles/admin.service';

export const GET = withPermission(
  'role.index',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await appRoleService.listRoles(context.companyUuid, {
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
    });

    return successResponse('Roles retrieved successfully', result);
  })
);

export const POST = withPermission(
  'role.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const body = await req.json();
    const result = validateSchema(createRoleSchema, body);
    if (!('data' in result)) return result;

    const role = await appRoleService.createRole(context.companyUuid, result.data);
    return successResponse('Role created successfully', role);
  })
);
