import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateCustomerSchema } from '@/lib/validations/customer';
import { posCustomerService } from '@/lib/modules/pos/customers/admin.service';

export const GET = withPermission(
  'admin.pos.sale.create',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const customer = await posCustomerService.getCustomer(uuid);
    return successResponse('Customer retrieved successfully', customer);
  })
);

export const PUT = withPermission(
  'admin.pos.sale.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const body = await req.json();
    const result = validateSchema(updateCustomerSchema, body);
    if (!('data' in result)) return result;

    const customer = await posCustomerService.updateCustomer(uuid, result.data);
    return successResponse('Customer updated successfully', customer);
  })
);

export const DELETE = withPermission(
  'admin.pos.sale.create',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posCustomerService.deleteCustomer(uuid);
    return successResponse('Customer deleted successfully', null);
  })
);
