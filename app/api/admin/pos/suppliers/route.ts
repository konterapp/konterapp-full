import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createSupplierSchema } from '@/lib/validations/supplier';
import { posSupplierService } from '@/lib/modules/pos/suppliers/admin.service';

export const GET = withPermission(
  'admin.pos.supplier.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';
    const isActive = searchParams.get('is_active');

    const result = await posSupplierService.listSuppliers({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
      isActive,
    });

    return successResponse('Suppliers retrieved successfully', result);
  })
);

export const POST = withPermission(
  'admin.pos.supplier.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      contact_person: rawBody.contact_person ?? rawBody.contactPerson,
      is_active: rawBody.is_active ?? rawBody.isActive,
    };
    const result = validateSchema(createSupplierSchema, body);
    if (!('data' in result)) return result;

    const supplier = await posSupplierService.createSupplier(result.data);
    return successResponse('Supplier created successfully', supplier);
  })
);
