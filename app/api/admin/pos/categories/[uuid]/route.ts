import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/categories/[uuid] - Get category detail
export const GET = withPermission(
  'admin.pos.category.index',
  async (req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) => {
  try {
    const { uuid } = await params;

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
      ...category,
      productCount: category._count.products,
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return errorResponse('Failed to fetch category', 500);
  }
});

// PUT /api/admin/pos/categories/[uuid] - Update category
export const PUT = withPermission(
  'admin.pos.category.update',
  async (req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) => {
  try {
    const { uuid } = await params;
    const body = await req.json();
    const { name, description } = body;

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
        name: name || existingCategory.name,
        description: description ?? existingCategory.description,
      },
    });

    return successResponse('Category updated successfully', category);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return errorResponse('Failed to update category', 500);
  }
});

// DELETE /api/admin/pos/categories/[uuid] - Delete category
export const DELETE = withPermission(
  'admin.pos.category.delete',
  async (req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) => {
  try {
    const { uuid } = await params;

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
