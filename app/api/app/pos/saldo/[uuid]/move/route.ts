import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { moveSaldoAccountSchema } from '@/lib/validations/saldo';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const POST = withPermission(
  'pos.saldo.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();

    const result = validateSchema(moveSaldoAccountSchema, rawBody);
    if (!('data' in result)) return result;

    await posSaldoService.moveAccount(context.companyUuid, uuid, result.data.direction);
    return successResponse('Urutan akun saldo berhasil diubah', null);
  })
);
