import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const DELETE = withPermission(
  'pos.saldo.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { balanceUuid } = await context.params;
    await posSaldoService.deleteBalanceGroup(balanceUuid);
    return successResponse('Grup balance berhasil dihapus', null);
  })
);
