import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/products/lookup-barcode?barcode=xxx
export const GET = withPermission('admin.pos.sale.create', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode');
    const branchUuid = searchParams.get('branch_uuid');

    if (!barcode) {
      return errorResponse('Barcode is required', 400);
    }

    const product = await prisma.posProduct.findFirst({
      where: {
        OR: [{ barcode }, { sku: barcode }],
        isActive: true,
      },
      include: {
        category: {
          select: { uuid: true, name: true },
        },
        stockItems: branchUuid
          ? {
              where: { branchUuid },
              select: { branchUuid: true, stock: true },
            }
          : true,
      },
    });

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Calculate available stock
    let availableStock = 0;
    if (branchUuid) {
      const stockItem = product.stockItems.find(
        item => item.branchUuid === branchUuid
      );
      availableStock = stockItem ? stockItem.stock : 0;
    } else {
      availableStock = product.stockItems.reduce(
        (sum, item) => sum + item.stock,
        0
      );
    }

    return successResponse('Product found', {
      ...product,
      available_stock: availableStock,
      stocks: product.stockItems.map(item => ({
        branch_uuid: item.branchUuid,
        stock: item.stock,
      })),
    });
  } catch (error: any) {
    console.error('Error looking up barcode:', error);
    return errorResponse('Failed to lookup barcode', 500);
  }
});
