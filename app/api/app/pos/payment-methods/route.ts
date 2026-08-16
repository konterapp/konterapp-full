import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createPaymentMethodSchema } from '@/lib/validations/payment-method';
import { posPaymentMethodService } from '@/lib/modules/pos/payment-methods/admin.service';

export const GET = withPermission(
  'pos.payment-method.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('is_active');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const result = await posPaymentMethodService.listPaymentMethods({
      page,
      perPage,
      search,
      isActive,
      sortBy,
      sortOrder,
    });

    return successResponse('Payment methods retrieved successfully', result);
  })
);

export const POST = withPermission(
  'pos.payment-method.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      accountNumber: rawBody.accountNumber ?? rawBody.account_number,
      accountName: rawBody.accountName ?? rawBody.account_name,
      isActive: rawBody.isActive ?? rawBody.is_active,
    };

    const result = validateSchema(createPaymentMethodSchema, body);
    if (!('data' in result)) return result;

    const paymentMethod = await posPaymentMethodService.createPaymentMethod(result.data);
    return successResponse('Payment method created successfully', paymentMethod);
  })
);
