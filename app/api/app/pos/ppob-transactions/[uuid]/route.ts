import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posPpobTransactionService } from '@/lib/modules/pos/ppob-transactions/admin.service';

export const GET = withPermission(
  'pos.ppob-transaction.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const transaction = await posPpobTransactionService.getTransaction(uuid, context.companyUuid, context.userId);
    return successResponse('Transaksi berhasil dimuat', transaction);
  })
);
