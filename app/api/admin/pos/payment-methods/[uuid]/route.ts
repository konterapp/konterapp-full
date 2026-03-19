import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validationError } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/api-middleware';
import { validateSchema } from '@/lib/validation';
import { updatePaymentMethodSchema } from '@/lib/validations/payment-method';

export const preferredRegion = "sin1";
// GET /api/admin/pos/payment-methods/[uuid] - Get payment method detail
export const GET = withPermission(
  'admin.pos.payment-method.index',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;

    const paymentMethod = await prisma.posPaymentMethod.findFirst({
      where: { uuid },
    });

    if (!paymentMethod) {
      return errorResponse('Payment method not found', 404);
    }

    return successResponse('Payment method retrieved successfully', paymentMethod);
  } catch (error: any) {
    console.error('Error fetching payment method:', error);
    return errorResponse('Failed to fetch payment method', 500);
  }
});

// PUT /api/admin/pos/payment-methods/[uuid] - Update payment method
export const PUT = withPermission(
  'admin.pos.payment-method.update',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      accountNumber: rawBody.accountNumber ?? rawBody.account_number,
      accountName: rawBody.accountName ?? rawBody.account_name,
      isActive: rawBody.isActive ?? rawBody.is_active,
    };
    const result = validateSchema(updatePaymentMethodSchema, body);
    if (!('data' in result)) return result;
    const validated = result.data;

    // Check if payment method exists
    const existingMethod = await prisma.posPaymentMethod.findFirst({
      where: { uuid },
    });

    if (!existingMethod) {
      return errorResponse('Payment method not found', 404);
    }

    // Check if code is being changed and already exists
    if (validated.code && validated.code !== existingMethod.code) {
      const codeExists = await prisma.posPaymentMethod.findUnique({
        where: { code: validated.code },
      });

      if (codeExists) {
        return validationError({ code: ['Kode metode sudah digunakan'] });
      }
    }

    const paymentMethod = await prisma.posPaymentMethod.update({
      where: { uuid },
      data: {
        code: validated.code || existingMethod.code,
        name: validated.name || existingMethod.name,
        type: validated.type || existingMethod.type,
        accountNumber: validated.accountNumber ?? existingMethod.accountNumber,
        accountName: validated.accountName ?? existingMethod.accountName,
        description: validated.description ?? existingMethod.description,
        isActive: validated.isActive ?? existingMethod.isActive,
      },
    });

    return successResponse('Payment method updated successfully', paymentMethod);
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return errorResponse('Failed to update payment method', 500);
  }
});

// DELETE /api/admin/pos/payment-methods/[uuid] - Delete payment method
export const DELETE = withPermission(
  'admin.pos.payment-method.delete',
  async (req: NextRequest, context) => {
  try {
    const { uuid } = await context.params;

    // Check if payment method exists
    const paymentMethod = await prisma.posPaymentMethod.findFirst({
      where: { uuid },
    });

    if (!paymentMethod) {
      return errorResponse('Payment method not found', 404);
    }

    // Check if payment method is used in transactions
    const [salesCount, ppobCount] = await Promise.all([
      prisma.posSale.count({ where: { paymentMethodUuid: uuid } }),
      prisma.posPpobTransaction.count({ where: { paymentMethodUuid: uuid } }),
    ]);

    if (salesCount > 0 || ppobCount > 0) {
      return errorResponse(
        'Cannot delete payment method with existing transactions',
        400
      );
    }

    await prisma.posPaymentMethod.delete({
      where: { uuid },
    });

    return successResponse('Payment method deleted successfully', null);
  } catch (error: any) {
    console.error('Error deleting payment method:', error);
    return errorResponse('Failed to delete payment method', 500);
  }
});