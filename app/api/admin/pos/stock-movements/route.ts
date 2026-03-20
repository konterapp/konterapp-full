import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

const roundDateEnd = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

// GET /api/admin/pos/stock-movements - List stock movements
export const GET = withPermission('admin.pos.stock-movement.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';
    const branchUuid = searchParams.get('branch_uuid') || '';
    const productUuid = searchParams.get('product_uuid') || '';
    const movementType = searchParams.get('movement_type') || '';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const skip = (page - 1) * perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (branchUuid) {
      where.branchUuid = branchUuid;
    }

    if (productUuid) {
      where.productUuid = productUuid;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (dateFrom || dateTo) {
      const createdAt: any = {};
      if (dateFrom) {
        createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        createdAt.lte = roundDateEnd(new Date(dateTo));
      }
      where.createdAt = createdAt;
    }

    const sortMap: Record<string, any> = {
      created_at: { createdAt: sortOrder },
      movement_type: { movementType: sortOrder },
      quantity_change: { quantity: sortOrder },
      quantity_before: { previousStock: sortOrder },
      quantity_after: { newStock: sortOrder },
      product_name: { product: { name: sortOrder } },
      branch_name: { branch: { name: sortOrder } },
    };

    const orderBy = sortMap[sortBy] || sortMap.created_at;

    const [movements, total] = await Promise.all([
      prisma.posStockMovement.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          product: { select: { uuid: true, name: true, sku: true } },
          branch: { select: { uuid: true, name: true } },
        },
      }),
      prisma.posStockMovement.count({ where }),
    ]);

    const mapped = movements.map((movement) => ({
      uuid: movement.uuid,
      created_at: movement.createdAt,
      movement_type: movement.movementType,
      quantity_change: movement.quantity,
      quantity_before: movement.previousStock,
      quantity_after: movement.newStock,
      reference_type: movement.referenceType,
      reference_uuid: movement.referenceUuid,
      notes: movement.notes,
      product: movement.product,
      branch: movement.branch,
    }));

    return successResponse('Stock movements retrieved successfully', {
      data: mapped,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return errorResponse('Failed to fetch stock movements', 500);
  }
});