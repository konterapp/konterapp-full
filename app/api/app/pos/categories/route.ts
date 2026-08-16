import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createCategorySchema } from '@/lib/validations/category';
import { posCategoryService } from '@/lib/modules/pos/categories/admin.service';

export const GET = withPermission(
  'pos.category.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posCategoryService.listCategories({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
    });

    return successResponse('Categories retrieved successfully', result);
  })
);

export const POST = withPermission(
  'pos.category.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const body = await req.json();
    const result = validateSchema(createCategorySchema, body);
    if (!('data' in result)) return result;

    const category = await posCategoryService.createCategory(result.data);
    return successResponse('Category created successfully', category);
  })
);
