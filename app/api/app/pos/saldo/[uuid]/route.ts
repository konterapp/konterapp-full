import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateSaldoAccountSchema } from '@/lib/validations/saldo';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const GET = withPermission(
  'pos.saldo.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const account = await posSaldoService.getAccount(uuid, context.companyUuid, context.userId);
    return successResponse('Akun saldo berhasil dimuat', account);
  })
);

export const PUT = withPermission(
  'pos.saldo.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      isPaymentMethod: rawBody.isPaymentMethod ?? rawBody.is_payment_method,
      isActive: rawBody.isActive ?? rawBody.is_active,
      showInShift: rawBody.showInShift ?? rawBody.show_in_shift,
      sortOrder: rawBody.sortOrder ?? rawBody.sort_order,
      isBankAgent: rawBody.isBankAgent ?? rawBody.is_bank_agent,
    };

    const result = validateSchema(updateSaldoAccountSchema, body);
    if (!('data' in result)) return result;

    const account = await posSaldoService.updateAccount(uuid, context.companyUuid, result.data);
    return successResponse('Akun saldo berhasil diperbarui', account);
  })
);

export const DELETE = withPermission(
  'pos.saldo.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posSaldoService.deleteAccount(uuid);
    return successResponse('Akun saldo berhasil dihapus', null);
  })
);
