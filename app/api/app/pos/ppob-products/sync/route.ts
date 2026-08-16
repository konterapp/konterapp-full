import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { ValidationApiError } from '@/lib/api-errors';
import { posPpobProductService } from '@/lib/modules/pos/ppob-products/admin.service';

export const POST = withPermission(
  'pos.ppob.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const body = await req.json();
    const provider = body.provider as string;
    const category = body.category as string;

    if (!provider || !category) {
      throw new ValidationApiError({ provider: ['Provider wajib diisi'], category: ['Kategori wajib diisi'] });
    }

    const count = await posPpobProductService.syncProducts(provider, category);
    return successResponse(`Sync ${category} berhasil`, { synced: count });
  })
);
