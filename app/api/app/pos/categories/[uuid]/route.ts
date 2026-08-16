import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateCategorySchema } from '@/lib/validations/category';
import { posCategoryService } from '@/lib/modules/pos/categories/admin.service';

export const GET = withPermission(
  'pos.category.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const category = await posCategoryService.getCategoryDetail(uuid);
    return successResponse('Category retrieved successfully', category);
  })
);

export const PATCH = withPermission(
  'pos.category.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const body = await req.json();
    const result = validateSchema(updateCategorySchema, body);
    if (!('data' in result)) return result;

    const category = await posCategoryService.updateCategory(uuid, result.data);
    return successResponse('Category updated successfully', category);
  })
);

export const PUT = PATCH;

export const DELETE = withPermission(
  'pos.category.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posCategoryService.deleteCategory(uuid);
    return successResponse('Category deleted successfully', null);
  })
);
