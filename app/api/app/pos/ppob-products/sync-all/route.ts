import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posPpobProductService } from '@/lib/modules/pos/ppob-products/admin.service';

export const POST = withPermission(
  'admin.pos.ppob.create',
  withApiErrorHandling(async (_req: NextRequest) => {
    const data = await posPpobProductService.syncAllDigiflazz();
    return successResponse('Sync semua kategori Digiflazz berhasil', data);
  })
);
