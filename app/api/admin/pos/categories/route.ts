import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/categories - List all categories
export const GET = withPermission('admin.pos.category.index', async (req: NextRequest) => {
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
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.posProductCategory.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.posProductCategory.count({ where }),
    ]);

    return successResponse('Categories retrieved successfully', {
      data: categories.map(cat => ({
        ...cat,
        productCount: cat._count.products,
      })),
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return errorResponse('Failed to fetch categories', 500);
  }
});

// POST /api/admin/pos/categories - Create new category
export const POST = withPermission('admin.pos.category.create', async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { name, description } = body;

    // Validation
    if (!name) {
      return errorResponse('Name is required', 400);
    }

    const category = await prisma.posProductCategory.create({
      data: {
        name,
        description: description || null,
      },
    });

    return successResponse('Category created successfully', category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return errorResponse('Failed to create category', 500);
  }
});
