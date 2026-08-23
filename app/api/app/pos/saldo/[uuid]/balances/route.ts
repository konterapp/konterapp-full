import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { addSaldoBalanceGroupSchema } from '@/lib/validations/saldo';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const POST = withPermission(
  'pos.saldo.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      branchUuids: rawBody.branchUuids ?? rawBody.branch_uuids,
      accountNumber: rawBody.accountNumber ?? rawBody.account_number,
      accountName: rawBody.accountName ?? rawBody.account_name,
      openingBalance: rawBody.openingBalance ?? rawBody.opening_balance,
      notes: rawBody.notes ?? null,
    };

    const result = validateSchema(addSaldoBalanceGroupSchema, body);
    if (!('data' in result)) return result;

    const account = await posSaldoService.addBalanceGroup(uuid, context.companyUuid, context.userId, result.data);
    return successResponse('Grup balance berhasil ditambahkan', account);
  })
);
