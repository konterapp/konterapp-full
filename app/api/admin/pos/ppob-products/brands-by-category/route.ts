import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { getPpobBrandsByCategorySchema } from '@/lib/validations/ppob-product';
import { posPpobProductService } from '@/lib/modules/pos/ppob-products/admin.service';

export const GET = withPermission(
  'admin.pos.ppob.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const raw = { category: searchParams.get('category') || '' };

    const result = validateSchema(getPpobBrandsByCategorySchema, raw);
    if (!('data' in result)) return result;

    const data = await posPpobProductService.getBrandsByCategory(result.data.category);
    return successResponse('PPOB brands retrieved successfully', data);
  })
);
