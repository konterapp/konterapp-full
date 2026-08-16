import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posTransactionService } from '@/lib/modules/pos/transactions/admin.service';

export const GET = withPermission(
  'pos.sale.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const sale = await posTransactionService.getTransactionDetail(uuid);
    return successResponse('Transaction retrieved successfully', sale);
  })
);
