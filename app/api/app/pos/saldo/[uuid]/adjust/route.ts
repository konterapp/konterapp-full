import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { adjustSaldoSchema } from '@/lib/validations/saldo';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const POST = withPermission(
  'pos.saldo.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      branchUuid: rawBody.branchUuid ?? rawBody.branch_uuid,
    };

    const result = validateSchema(adjustSaldoSchema, body);
    if (!('data' in result)) return result;

    const account = await posSaldoService.adjustBalance(uuid, context.companyUuid, context.userId, result.data);
    return successResponse('Saldo berhasil dikoreksi', account);
  })
);
