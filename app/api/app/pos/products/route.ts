import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createProductSchema } from '@/lib/validations/product';
import { normalizeProductBody, posProductService } from '@/lib/modules/pos/products/admin.service';

export const GET = withPermission(
  'pos.product.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const categoryUuid = searchParams.get('category_uuid');
    const branchUuid = searchParams.get('branch_uuid');
    const isActive = searchParams.get('is_active');
    const inStockOnly = searchParams.get('in_stock');
    const kind = searchParams.get('kind');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posProductService.listProducts({
      page,
      perPage,
      search,
      categoryUuid,
      branchUuid,
      isActive,
      inStockOnly,
      kind,
      sortBy,
      sortOrder,
    });

    return successResponse('Products retrieved successfully', result);
  })
);

export const POST = withPermission(
  'pos.product.create',
  withApiErrorHandling(async (req: NextRequest) => {
    const contentType = req.headers.get('content-type') || '';
    let rawBody: Record<string, any> = {};
    let imageFiles: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      rawBody = Object.fromEntries(formData.entries());
      const images = formData.getAll('images[]');
      const altImages = formData.getAll('images');
      imageFiles = [...images, ...altImages].filter((file): file is File => file instanceof File);
    } else {
      rawBody = await req.json();
    }

    const body = normalizeProductBody(rawBody);
    const result = validateSchema(createProductSchema, body);
    if (!('data' in result)) return result;

    const product = await posProductService.createProduct(result.data, imageFiles);
    return successResponse('Product created successfully', product);
  })
);
