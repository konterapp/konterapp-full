import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const GET = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async () => {
    const result = await posSaldoService.listPaymentMethodOptions();
    return successResponse('Metode pembayaran berhasil dimuat', result);
  })
);
