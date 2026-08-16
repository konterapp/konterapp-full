import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createCustomerSchema } from '@/lib/validations/customer';
import { posCustomerService } from '@/lib/modules/pos/customers/admin.service';

export const GET = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';

    const result = await posCustomerService.listCustomers({ page, perPage, search });
    return successResponse('Customers retrieved successfully', result);
  })
);

export const POST = withPermission(
  'pos.sale.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const body = await req.json();
    const result = validateSchema(createCustomerSchema, body);
    if (!('data' in result)) return result;

    const customer = await posCustomerService.createCustomer(result.data);
    return successResponse('Customer created successfully', customer);
  })
);
