import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posBankAgentTransactionService } from '@/lib/modules/pos/bank-agent-transactions/admin.service';

export const GET = withPermission(
  'pos.bank-agent-transaction.index',
  withApiErrorHandling(async () => {
    const types = posBankAgentTransactionService.listTransactionTypes();
    return successResponse('Daftar jenis transaksi berhasil dimuat', types);
  })
);
