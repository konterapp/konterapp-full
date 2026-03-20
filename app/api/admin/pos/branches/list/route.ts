import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';

// GET /api/admin/pos/branches/list - List all branches without pagination
export const GET = withPermission('admin.pos.branch.index', async (_req: NextRequest) => {
  try {
    const branches = await prisma.posBranch.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        uuid: true,
        code: true,
        name: true,
        isMain: true,
        isActive: true,
      },
    });

    return successResponse('Branches retrieved successfully', branches);
  } catch (error: any) {
    console.error('Error fetching branches list:', error);
    return errorResponse('Failed to fetch branches', 500);
  }
});