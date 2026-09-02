import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createBankAgentTransactionTypeSchema } from '@/lib/validations/bank-agent-transaction';
import { posBankAgentTransactionService } from '@/lib/modules/pos/bank-agent-transactions/admin.service';

export const GET = withPermission(
  'pos.bank-agent-transaction.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const types = await posBankAgentTransactionService.listTransactionTypes(context.companyUuid);
    return successResponse('Daftar jenis transaksi berhasil dimuat', types);
  })
);

export const POST = withPermission(
  'pos.bank-agent-transaction-type.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      cashDirection: rawBody.cashDirection ?? rawBody.cash_direction,
      isActive: rawBody.isActive ?? rawBody.is_active,
      sortOrder: rawBody.sortOrder ?? rawBody.sort_order,
    };

    const result = validateSchema(createBankAgentTransactionTypeSchema, body);
    if (!('data' in result)) return result;

    const type = await posBankAgentTransactionService.createTransactionType(context.companyUuid, result.data);
    return successResponse('Jenis transaksi berhasil dibuat', type);
  })
);
