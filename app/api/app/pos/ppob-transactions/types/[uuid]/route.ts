import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updatePpobTransactionTypeSchema } from '@/lib/validations/ppob-transaction';
import { posPpobTransactionService } from '@/lib/modules/pos/ppob-transactions/admin.service';

export const PATCH = withPermission(
  'pos.ppob-transaction-type.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      cashDirection: rawBody.cashDirection ?? rawBody.cash_direction,
      isActive: rawBody.isActive ?? rawBody.is_active,
      sortOrder: rawBody.sortOrder ?? rawBody.sort_order,
    };

    const result = validateSchema(updatePpobTransactionTypeSchema, body);
    if (!('data' in result)) return result;

    const type = await posPpobTransactionService.updateTransactionType(uuid, context.companyUuid, result.data);
    return successResponse('Jenis transaksi berhasil diperbarui', type);
  })
);

export const PUT = PATCH;

export const DELETE = withPermission(
  'pos.ppob-transaction-type.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posPpobTransactionService.deleteTransactionType(uuid, context.companyUuid);
    return successResponse('Jenis transaksi berhasil dihapus', null);
  })
);
