import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createPpobProductSchema } from '@/lib/validations/ppob-product';
import { posPpobProductService } from '@/lib/modules/pos/ppob-products/admin.service';

export const GET = withPermission(
  'admin.pos.ppob.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '25');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || undefined;
    const provider = searchParams.get('provider') || undefined;
    const isActive = searchParams.get('is_active') || undefined;
    const sortBy = searchParams.get('sort_by') || 'product_name';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? 'desc' : 'asc';

    const result = await posPpobProductService.listProducts({
      page,
      perPage,
      search,
      category,
      provider,
      isActive,
      sortBy,
      sortOrder,
    });

    return successResponse('PPOB products retrieved successfully', result);
  })
);

export const POST = withPermission(
  'admin.pos.ppob.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      base_price: Number(rawBody.base_price),
      admin_fee: rawBody.admin_fee !== undefined ? Number(rawBody.admin_fee) : undefined,
      selling_price: Number(rawBody.selling_price),
      is_active: rawBody.is_active ?? rawBody.isActive,
    };

    const result = validateSchema(createPpobProductSchema, body);
    if (!('data' in result)) return result;

    const product = await posPpobProductService.createProduct(result.data);
    return successResponse('PPOB product created successfully', product, 201);
  })
);
