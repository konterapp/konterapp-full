import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const GET = withPermission(
  'pos.saldo.index',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const balanceUuid = searchParams.get('balance_uuid');

    const result = await posSaldoService.listMutations(uuid, {
      page,
      perPage,
      balanceUuid,
      companyUuid: context.companyUuid,
      userId: context.userId,
    });
    return successResponse('Riwayat mutasi saldo berhasil dimuat', result);
  })
);
