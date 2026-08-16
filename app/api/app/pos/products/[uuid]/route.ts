import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { updateProductSchema } from '@/lib/validations/product';
import { normalizeProductBody, posProductService } from '@/lib/modules/pos/products/admin.service';

export const GET = withPermission(
  'pos.product.index',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    const product = await posProductService.getProductDetail(uuid);
    return successResponse('Product retrieved successfully', product);
  })
);

export const PATCH = withPermission(
  'pos.product.update',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;

    const contentType = req.headers.get('content-type') || '';
    let rawBody: Record<string, any> = {};
    let imageFiles: File[] = [];
    let deleteImages: string[] = [];
    let primaryImage: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      rawBody = Object.fromEntries(formData.entries());
      const images = formData.getAll('images[]');
      const altImages = formData.getAll('images');
      imageFiles = [...images, ...altImages].filter((file): file is File => file instanceof File);
      deleteImages = formData.getAll('delete_images[]').map(String);
      if (deleteImages.length === 0) {
        deleteImages = formData.getAll('delete_images').map(String);
      }
      const primary = formData.get('primary_image');
      primaryImage = primary ? String(primary) : null;
    } else {
      rawBody = await req.json();
      deleteImages = Array.isArray(rawBody.delete_images) ? rawBody.delete_images : [];
      primaryImage = rawBody.primary_image ?? null;
    }

    const body = normalizeProductBody(rawBody);
    const result = validateSchema(updateProductSchema, body);
    if (!('data' in result)) return result;

    const product = await posProductService.updateProduct(uuid, result.data, imageFiles, deleteImages, primaryImage);
    return successResponse('Product updated successfully', product);
  })
);

export const PUT = PATCH;

export const DELETE = withPermission(
  'pos.product.delete',
  withApiErrorHandling(async (_req: NextRequest, context) => {
    const { uuid } = await context.params;
    await posProductService.deleteProduct(uuid);
    return successResponse('Product deleted successfully', null);
  })
);
