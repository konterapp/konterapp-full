import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/customers - List all customers
export const GET = withPermission('admin.pos.sale.create', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.posCustomer.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.posCustomer.count({ where }),
    ]);

    return successResponse('Customers retrieved successfully', {
      data: customers,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return errorResponse('Failed to fetch customers', 500);
  }
});

// POST /api/admin/pos/customers - Create new customer
export const POST = withPermission('admin.pos.sale.create', async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { name, phone, email, address } = body;

    // Validation
    if (!name) {
      return errorResponse('Name is required', 400);
    }

    const customer = await prisma.posCustomer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });

    return successResponse('Customer created successfully', customer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return errorResponse('Failed to create customer', 500);
  }
});