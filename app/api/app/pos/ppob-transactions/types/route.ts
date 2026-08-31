import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createPpobTransactionTypeSchema } from '@/lib/validations/ppob-transaction';
import { posPpobTransactionService } from '@/lib/modules/pos/ppob-transactions/admin.service';

export const GET = withPermission(
  'pos.ppob-transaction.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const types = await posPpobTransactionService.listTransactionTypes(context.companyUuid);
    return successResponse('Daftar jenis transaksi berhasil dimuat', types);
  })
);

export const POST = withPermission(
  'pos.ppob-transaction-type.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      cashDirection: rawBody.cashDirection ?? rawBody.cash_direction,
      isActive: rawBody.isActive ?? rawBody.is_active,
      sortOrder: rawBody.sortOrder ?? rawBody.sort_order,
    };

    const result = validateSchema(createPpobTransactionTypeSchema, body);
    if (!('data' in result)) return result;

    const type = await posPpobTransactionService.createTransactionType(context.companyUuid, result.data);
    return successResponse('Jenis transaksi berhasil dibuat', type);
  })
);
