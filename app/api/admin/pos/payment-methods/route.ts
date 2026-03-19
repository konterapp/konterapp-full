import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validationError } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { createPaymentMethodSchema } from '@/lib/validations/payment-method';

// GET /api/admin/pos/payment-methods - List all payment methods
export const GET = withPermission('admin.pos.payment-method.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('is_active');

    const skip = (page - 1) * perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const allowedSorts = ['created_at', 'code', 'name', 'type', 'is_active'];
    const sortFieldMap: Record<string, string> = {
      created_at: 'createdAt',
      code: 'code',
      name: 'name',
      type: 'type',
      is_active: 'isActive',
    };
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [paymentMethods, total] = await Promise.all([
      prisma.posPaymentMethod.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortDir },
      }),
      prisma.posPaymentMethod.count({ where }),
    ]);

    return successResponse('Payment methods retrieved successfully', {
      data: paymentMethods,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    return errorResponse('Failed to fetch payment methods', 500);
  }
});

// POST /api/admin/pos/payment-methods - Create new payment method
export const POST = withPermission('admin.pos.payment-method.create', async (req: NextRequest) => {
  try {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      accountNumber: rawBody.accountNumber ?? rawBody.account_number,
      accountName: rawBody.accountName ?? rawBody.account_name,
      isActive: rawBody.isActive ?? rawBody.is_active,
    };
    const result = validateSchema(createPaymentMethodSchema, body);
    if (!('data' in result)) return result;
    const validated = result.data;

    // Check if code already exists
    const existingMethod = await prisma.posPaymentMethod.findUnique({
      where: { code: validated.code },
    });

    if (existingMethod) {
      return validationError({ code: ['Kode metode sudah digunakan'] });
    }

    const paymentMethod = await prisma.posPaymentMethod.create({
      data: {
        code: validated.code,
        name: validated.name,
        type: validated.type || 'cash',
        accountNumber: validated.accountNumber || null,
        accountName: validated.accountName || null,
        description: validated.description || null,
        isActive: validated.isActive ?? true,
      },
    });

    return successResponse('Payment method created successfully', paymentMethod);
  } catch (error: any) {
    console.error('Error creating payment method:', error);
    return errorResponse('Failed to create payment method', 500);
  }
});
