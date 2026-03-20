import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/purchases - List all purchases
export const GET = withPermission('admin.pos.purchase.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';
    const branchUuid = searchParams.get('branch_uuid') || '';
    const supplierUuid = searchParams.get('supplier_uuid') || '';
    const paymentStatus = searchParams.get('payment_status') || '';

    const skip = (page - 1) * perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (branchUuid) {
      where.branchUuid = branchUuid;
    }

    if (supplierUuid) {
      where.supplierUuid = supplierUuid;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const sortMap: Record<string, any> = {
      created_at: { createdAt: sortOrder },
      purchase_date: { purchaseDate: sortOrder },
      total_amount: { totalAmount: sortOrder },
      payment_status: { paymentStatus: sortOrder },
      purchase_number: { purchaseNumber: sortOrder },
    };

    const orderBy = sortMap[sortBy] || sortMap.created_at;

    const [purchases, total] = await Promise.all([
      prisma.posPurchase.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        include: {
          branch: { select: { uuid: true, name: true } },
          supplier: { select: { uuid: true, name: true, code: true } },
        },
      }),
      prisma.posPurchase.count({ where }),
    ]);

    const mapped = purchases.map((purchase) => ({
      uuid: purchase.uuid,
      purchase_number: purchase.purchaseNumber,
      purchase_date: purchase.purchaseDate,
      total_amount: Number(purchase.totalAmount),
      payment_status: purchase.paymentStatus,
      branch: purchase.branch,
      supplier: purchase.supplier,
    }));

    return successResponse('Purchases retrieved successfully', {
      data: mapped,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching purchases:', error);
    return errorResponse('Failed to fetch purchases', 500);
  }
});