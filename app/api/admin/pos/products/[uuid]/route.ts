import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/products/[uuid] - Get product detail
export const GET = withPermission(
  'admin.pos.product.index',
  async (req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) => {
  try {
    const { uuid } = await params;

    const product = await prisma.posProduct.findFirst({
      where: { uuid },
      include: {
        category: {
          select: { uuid: true, name: true },
        },
        stockItems: {
          include: {
            branch: {
              select: { uuid: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse('Product retrieved successfully', {
      ...product,
      stocks: product.stockItems.map(item => ({
        branch_uuid: item.branchUuid,
        branch_name: item.branch.name,
        stock: item.stock,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return errorResponse('Failed to fetch product', 500);
  }
});

// PUT /api/admin/pos/products/[uuid] - Update product
export const PUT = withPermission(
  'admin.pos.product.update',
  async (req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) => {
  try {
    const { uuid } = await params;
    const body = await req.json();
    const {
      categoryUuid,
      name,
      sku,
      description,
      barcode,
      sellingPrice,
      minSellingPrice,
      minStock,
      unit,
      isActive,
      image,
    } = body;

    // Check if product exists
    const existingProduct = await prisma.posProduct.findFirst({
      where: { uuid },
    });

    if (!existingProduct) {
      return errorResponse('Product not found', 404);
    }

    // Check if SKU is being changed and already exists
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.posProduct.findUnique({
        where: { sku },
      });

      if (skuExists) {
        return errorResponse('Product SKU already exists', 400);
      }
    }

    // Check if barcode is being changed and already exists
    if (barcode && barcode !== existingProduct.barcode) {
      const barcodeExists = await prisma.posProduct.findFirst({
        where: { barcode },
      });

      if (barcodeExists) {
        return errorResponse('Product barcode already exists', 400);
      }
    }

    const product = await prisma.posProduct.update({
      where: { uuid },
      data: {
        categoryUuid: categoryUuid || existingProduct.categoryUuid,
        name: name || existingProduct.name,
        sku: sku || existingProduct.sku,
        description: description ?? existingProduct.description,
        barcode: barcode ?? existingProduct.barcode,
        sellingPrice: sellingPrice
          ? parseFloat(sellingPrice)
          : existingProduct.sellingPrice,
        minSellingPrice: minSellingPrice
          ? parseFloat(minSellingPrice)
          : existingProduct.minSellingPrice,
        minStock: minStock ?? existingProduct.minStock,
        unit: unit || existingProduct.unit,
        isActive: isActive ?? existingProduct.isActive,
        image: image ?? existingProduct.image,
      },
      include: {
        category: {
          select: { uuid: true, name: true },
        },
        stockItems: true,
      },
    });

    return successResponse('Product updated successfully', product);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return errorResponse('Failed to update product', 500);
  }
});

// DELETE /api/admin/pos/products/[uuid] - Delete product (soft delete)
export const DELETE = withPermission(
  'admin.pos.product.delete',
  async (req: NextRequest, { params }: { params: Promise<{ uuid: string }> }) => {
  try {
    const { uuid } = await params;

    // Check if product exists
    const product = await prisma.posProduct.findFirst({
      where: { uuid },
    });

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Check if product has transactions
    const [saleItemsCount, purchaseItemsCount] = await Promise.all([
      prisma.posSaleItem.count({ where: { productUuid: uuid } }),
      prisma.posPurchaseItem.count({ where: { productUuid: uuid } }),
    ]);

    if (saleItemsCount > 0 || purchaseItemsCount > 0) {
      return errorResponse(
        'Cannot delete product with existing transactions',
        400
      );
    }

    // Soft delete
    await prisma.posProduct.delete({
      where: { uuid },
    });

    return successResponse('Product deleted successfully', null);
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return errorResponse('Failed to delete product', 500);
  }
});
