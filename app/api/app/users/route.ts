import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createAppUserSchema } from '@/lib/validations/tenant-user';
import { appUserService } from '@/lib/modules/users/app.admin.service';

export const GET = withPermission(
  'user.index',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await appUserService.listUsers(context.companyUuid, {
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
    });

    return successResponse('Users retrieved successfully', result);
  })
);

export const POST = withPermission(
  'user.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const body = await req.json();
    const result = validateSchema(createAppUserSchema, body);
    if (!('data' in result)) return result;

    const user = await appUserService.createUser(context.companyUuid, result.data);
    return successResponse('User created successfully', user, 201);
  })
);
