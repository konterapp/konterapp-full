import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validationError } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { updateBranchSchema } from '@/lib/validations/branch';

// GET /api/admin/pos/branches/[uuid] - Get branch detail
export const GET = withPermission('admin.pos.branch.index', async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;

    const branch = await prisma.posBranch.findFirst({
      where: { uuid },
    });

    if (!branch) {
      return errorResponse('Branch not found', 404);
    }

    return successResponse('Branch retrieved successfully', branch);
  } catch (error: any) {
    console.error('Error fetching branch:', error);
    return errorResponse('Failed to fetch branch', 500);
  }
});

// PUT /api/admin/pos/branches/[uuid] - Update branch
export const PUT = withPermission('admin.pos.branch.update', async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      isActive: rawBody.isActive ?? rawBody.is_active,
      isMain: rawBody.isMain ?? rawBody.is_main,
    };
    const result = validateSchema(updateBranchSchema, body);
    if (!('data' in result)) return result;
    const validated = result.data;

    // Check if branch exists
    const existingBranch = await prisma.posBranch.findFirst({
      where: { uuid },
    });

    if (!existingBranch) {
      return errorResponse('Branch not found', 404);
    }

    // Check if code is being changed and already exists
    if (validated.code && validated.code !== existingBranch.code) {
      const codeExists = await prisma.posBranch.findUnique({
        where: { code: validated.code },
      });

      if (codeExists) {
        return validationError({ code: ['Kode cabang sudah digunakan'] });
      }
    }

    // If this is main branch, unset other main branches
    if (validated.isMain && !existingBranch.isMain) {
      await prisma.posBranch.updateMany({
        where: {
          isMain: true,
          NOT: { uuid },
        },
        data: { isMain: false },
      });
    }

    const branch = await prisma.posBranch.update({
      where: { uuid },
      data: {
        code: validated.code || existingBranch.code,
        name: validated.name || existingBranch.name,
        address: validated.address ?? existingBranch.address,
        phone: validated.phone ?? existingBranch.phone,
        email: validated.email ?? existingBranch.email,
        isActive: validated.isActive ?? existingBranch.isActive,
        isMain: validated.isMain ?? existingBranch.isMain,
      },
    });

    return successResponse('Branch updated successfully', branch);
  } catch (error: any) {
    console.error('Error updating branch:', error);
    return errorResponse('Failed to update branch', 500);
  }
});

// DELETE /api/admin/pos/branches/[uuid] - Delete branch
export const DELETE = withPermission('admin.pos.branch.delete', async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;

    // Check if branch exists
    const branch = await prisma.posBranch.findFirst({
      where: { uuid },
    });

    if (!branch) {
      return errorResponse('Branch not found', 404);
    }

    // Check if branch has transactions/products
    const [salesCount, purchasesCount, stockCount] = await Promise.all([
      prisma.posSale.count({ where: { branchUuid: uuid } }),
      prisma.posPurchase.count({ where: { branchUuid: uuid } }),
      prisma.posProductStock.count({ where: { branchUuid: uuid } }),
    ]);

    if (salesCount > 0 || purchasesCount > 0 || stockCount > 0) {
      return errorResponse(
        'Cannot delete branch with existing transactions or stock',
        400
      );
    }

    await prisma.posBranch.delete({
      where: { uuid },
    });

    return successResponse('Branch deleted successfully', null);
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return errorResponse('Failed to delete branch', 500);
  }
});
