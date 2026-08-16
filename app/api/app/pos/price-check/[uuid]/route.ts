import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posProductService } from '@/lib/modules/pos/products/admin.service';

export const GET = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async (_req, context) => {
    const { uuid } = await context.params;
    const product = await posProductService.getProductDetail(uuid);
    return successResponse('Price check product retrieved successfully', product);
  })
);
