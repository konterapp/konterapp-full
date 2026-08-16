import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { getPpobProductsByCategorySchema } from '@/lib/validations/ppob-product';
import { posPpobProductService } from '@/lib/modules/pos/ppob-products/admin.service';

export const GET = withPermission(
  'pos.ppob.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const raw = {
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || undefined,
    };

    const result = validateSchema(getPpobProductsByCategorySchema, raw);
    if (!('data' in result)) return result;

    const data = await posPpobProductService.getProductsByCategory(result.data);
    return successResponse('PPOB products retrieved successfully', data);
  })
);
