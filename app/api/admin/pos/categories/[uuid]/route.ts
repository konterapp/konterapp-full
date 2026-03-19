import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { updateCategorySchema } from '@/lib/validations/category';

// GET /api/admin/pos/categories/[uuid] - Get category detail
export const GET = withPermission(
  'admin.pos.category.index',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;

    const category = await prisma.posProductCategory.findFirst({
      where: { uuid },
      include: {
        products: {
          select: {
            uuid: true,
            name: true,
            sku: true,
            sellingPrice: true,
            isActive: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    return successResponse('Category retrieved successfully', {
      uuid: category.uuid,
      name: category.name,
      description: category.description,
      product_count: category._count.products,
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return errorResponse('Failed to fetch category', 500);
  }
});

// PATCH /api/admin/pos/categories/[uuid] - Update category
export const PATCH = withPermission(
  'admin.pos.category.update',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;
    const body = await req.json();
    const result = validateSchema(updateCategorySchema, body);
    if (!('data' in result)) return result;
    const validated = result.data;

    // Check if category exists
    const existingCategory = await prisma.posProductCategory.findFirst({
      where: { uuid },
    });

    if (!existingCategory) {
      return errorResponse('Category not found', 404);
    }

    const category = await prisma.posProductCategory.update({
      where: { uuid },
      data: {
        name: validated.name ?? existingCategory.name,
        description: validated.description ?? existingCategory.description,
      },
    });

    return successResponse('Category updated successfully', {
      uuid: category.uuid,
      name: category.name,
      description: category.description,
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return errorResponse('Failed to update category', 500);
  }
});

// PUT /api/admin/pos/categories/[uuid] - Update category (alias)
export const PUT = PATCH;

// DELETE /api/admin/pos/categories/[uuid] - Delete category
export const DELETE = withPermission(
  'admin.pos.category.delete',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;

    // Check if category exists
    const category = await prisma.posProductCategory.findFirst({
      where: { uuid },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    // Check if category has products
    const productCount = await prisma.posProduct.count({
      where: { categoryUuid: uuid },
    });

    if (productCount > 0) {
      return errorResponse('Cannot delete category with existing products', 400);
    }

    await prisma.posProductCategory.delete({
      where: { uuid },
    });

    return successResponse('Category deleted successfully', null);
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return errorResponse('Failed to delete category', 500);
  }
});
