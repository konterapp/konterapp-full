import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updatePpobProductSchema } from '@/lib/validations/ppob-product';
import { posPpobProductService } from '@/lib/modules/pos/ppob-products/admin.service';

export const PATCH = withPermission(
  'admin.pos.ppob.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      base_price: rawBody.base_price !== undefined ? Number(rawBody.base_price) : undefined,
      admin_fee: rawBody.admin_fee !== undefined ? Number(rawBody.admin_fee) : undefined,
      selling_price: rawBody.selling_price !== undefined ? Number(rawBody.selling_price) : undefined,
      is_active: rawBody.is_active ?? rawBody.isActive,
    };

    const result = validateSchema(updatePpobProductSchema, body);
    if (!('data' in result)) return result;

    const product = await posPpobProductService.updateProduct(uuid, result.data);
    return successResponse('PPOB product updated successfully', product);
  })
);

export const DELETE = withPermission(
  'admin.pos.ppob.create',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posPpobProductService.deleteProduct(uuid);
    return successResponse('PPOB product deleted successfully', null);
  })
);
