import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { bulkDeletePpobProductSchema } from '@/lib/validations/ppob-product';
import { posPpobProductService } from '@/lib/modules/pos/ppob-products/admin.service';

export const POST = withPermission(
  'pos.ppob.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const rawBody = await req.json();
    const result = validateSchema(bulkDeletePpobProductSchema, rawBody);
    if (!('data' in result)) return result;

    const payload = await posPpobProductService.bulkDeleteProducts(result.data.uuids);
    return successResponse('Produk PPOB berhasil dihapus', payload);
  })
);
