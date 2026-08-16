import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posProductService } from '@/lib/modules/pos/products/admin.service';

export const GET = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode') || '';
    const branchUuid = searchParams.get('branch_uuid');

    const product = await posProductService.lookupBarcode(barcode, branchUuid);
    return successResponse('Product found', product);
  })
);
