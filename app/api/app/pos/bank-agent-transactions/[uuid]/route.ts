import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posBankAgentTransactionService } from '@/lib/modules/pos/bank-agent-transactions/admin.service';

export const GET = withPermission(
  'pos.bank-agent-transaction.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const transaction = await posBankAgentTransactionService.getTransaction(uuid, context.companyUuid, context.userId);
    return successResponse('Transaksi berhasil dimuat', transaction);
  })
);
