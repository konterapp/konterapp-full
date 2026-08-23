import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateSaldoBalanceGroupSchema } from '@/lib/validations/saldo';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const PUT = withPermission(
  'pos.saldo.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { balanceUuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      branchUuids: rawBody.branchUuids ?? rawBody.branch_uuids,
      accountNumber: rawBody.accountNumber ?? rawBody.account_number,
      accountName: rawBody.accountName ?? rawBody.account_name,
    };

    const result = validateSchema(updateSaldoBalanceGroupSchema, body);
    if (!('data' in result)) return result;

    const account = await posSaldoService.updateBalanceGroup(balanceUuid, context.companyUuid, result.data);
    return successResponse('Grup balance berhasil diperbarui', account);
  })
);

export const DELETE = withPermission(
  'pos.saldo.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { balanceUuid } = await context.params;
    await posSaldoService.deleteBalanceGroup(balanceUuid);
    return successResponse('Grup balance berhasil dihapus', null);
  })
);
