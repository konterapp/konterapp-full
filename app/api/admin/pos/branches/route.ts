import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validationError } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { createBranchSchema } from '@/lib/validations/branch';

// GET /api/admin/pos/branches - List all branches
export const GET = withPermission('admin.pos.branch.index', async (req: NextRequest) => {
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
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [branches, total] = await Promise.all([
      prisma.posBranch.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.posBranch.count({ where }),
    ]);

    return successResponse('Branches retrieved successfully', {
      data: branches,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return errorResponse('Failed to fetch branches', 500);
  }
});

// POST /api/admin/pos/branches - Create new branch
export const POST = withPermission('admin.pos.branch.create', async (req: NextRequest) => {
  try {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      isActive: rawBody.isActive ?? rawBody.is_active,
      isMain: rawBody.isMain ?? rawBody.is_main,
    };
    const result = validateSchema(createBranchSchema, body);
    if (!('data' in result)) return result;
    const validated = result.data;

    // Validation
    // Check if code already exists
    const existingBranch = await prisma.posBranch.findUnique({
      where: { code: validated.code },
    });

    if (existingBranch) {
      return validationError({ code: ['Kode cabang sudah digunakan'] });
    }

    // If this is main branch, unset other main branches
    let branchesToReset: any[] = [];
    if (validated.isMain) {
      branchesToReset = await prisma.posBranch.findMany({
        where: { isMain: true },
        select: { uuid: true },
      });
    }

    const branch = await prisma.posBranch.create({
      data: {
        code: validated.code,
        name: validated.name,
        address: validated.address || null,
        phone: validated.phone || null,
        email: validated.email || null,
        isActive: validated.isActive ?? true,
        isMain: validated.isMain ?? false,
      },
    });

    // If this is set as main branch, unset others
    if (validated.isMain && branchesToReset.length > 0) {
      await prisma.posBranch.updateMany({
        where: {
          isMain: true,
          NOT: { uuid: branch.uuid },
        },
        data: { isMain: false },
      });
    }

    return successResponse('Branch created successfully', branch);
  } catch (error: any) {
    console.error('Error creating branch:', error);
    return errorResponse('Failed to create branch', 500);
  }
});