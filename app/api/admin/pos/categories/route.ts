import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validationError } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { createCategorySchema } from '@/lib/validations/category';

// GET /api/admin/pos/categories - List all categories
export const GET = withPermission('admin.pos.category.index', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const sortFieldMap: Record<string, string> = {
      created_at: 'createdAt',
      name: 'name',
    };
    const sortField = sortFieldMap[sortBy] ? sortBy : 'created_at';

    const [categories, total] = await Promise.all([
      prisma.posProductCategory.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { [sortFieldMap[sortField]]: sortOrder },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.posProductCategory.count({ where }),
    ]);

    const mapped = categories.map(cat => ({
      uuid: cat.uuid,
      name: cat.name,
      description: cat.description,
      product_count: cat._count.products,
      created_at: cat.createdAt,
      updated_at: cat.updatedAt,
    }));

    return successResponse('Categories retrieved successfully', {
      data: mapped,
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
    const result = validateSchema(createCategorySchema, body);
    if (!('data' in result)) return result;
    const validated = result.data;

    const existing = await prisma.posProductCategory.findFirst({
      where: { name: validated.name },
    });

    if (existing) {
      return validationError({ name: ['Nama kategori sudah digunakan'] });
    }

    const category = await prisma.posProductCategory.create({
      data: {
        name: validated.name,
        description: validated.description || null,
      },
    });

    const mapped = {
      uuid: category.uuid,
      name: category.name,
      description: category.description,
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    };

    return successResponse('Category created successfully', mapped);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return errorResponse('Failed to create category', 500);
  }
});