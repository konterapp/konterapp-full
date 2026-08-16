import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updatePaymentMethodSchema } from '@/lib/validations/payment-method';
import { posPaymentMethodService } from '@/lib/modules/pos/payment-methods/admin.service';

export const GET = withPermission(
  'pos.payment-method.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const paymentMethod = await posPaymentMethodService.getPaymentMethod(uuid);
    return successResponse('Payment method retrieved successfully', paymentMethod);
  })
);

export const PUT = withPermission(
  'pos.payment-method.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      accountNumber: rawBody.accountNumber ?? rawBody.account_number,
      accountName: rawBody.accountName ?? rawBody.account_name,
      isActive: rawBody.isActive ?? rawBody.is_active,
    };

    const result = validateSchema(updatePaymentMethodSchema, body);
    if (!('data' in result)) return result;

    const paymentMethod = await posPaymentMethodService.updatePaymentMethod(uuid, result.data);
    return successResponse('Payment method updated successfully', paymentMethod);
  })
);

export const DELETE = withPermission(
  'pos.payment-method.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posPaymentMethodService.deletePaymentMethod(uuid);
    return successResponse('Payment method deleted successfully', null);
  })
);
