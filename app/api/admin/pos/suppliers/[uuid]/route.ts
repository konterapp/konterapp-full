import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateSupplierSchema } from '@/lib/validations/supplier';
import { posSupplierService } from '@/lib/modules/pos/suppliers/admin.service';

export const GET = withPermission(
  'admin.pos.supplier.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const supplier = await posSupplierService.getSupplier(uuid);
    return successResponse('Supplier retrieved successfully', supplier);
  })
);

export const PATCH = withPermission(
  'admin.pos.supplier.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      contact_person: rawBody.contact_person ?? rawBody.contactPerson,
      is_active: rawBody.is_active ?? rawBody.isActive,
    };

    const result = validateSchema(updateSupplierSchema, body);
    if (!('data' in result)) return result;

    const supplier = await posSupplierService.updateSupplier(uuid, result.data);
    return successResponse('Supplier updated successfully', supplier);
  })
);

export const PUT = PATCH;

export const DELETE = withPermission(
  'admin.pos.supplier.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posSupplierService.deleteSupplier(uuid);
    return successResponse('Supplier deleted successfully', null);
  })
);
