import { NextRequest } from 'next/server';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { successResponse } from '@/lib/response';
import { validateSchema } from '@/lib/validation';
import { posPayableService } from '@/lib/modules/pos/payables/admin.service';
import { payPayableSchema } from '@/lib/validations/payable';

export const POST = withPermission(
  'pos.purchase.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { uuid } = await context.params;
    const rawBody = (await req.json()) as Record<string, unknown>;
    const body = {
      amount: rawBody.amount,
      notes: rawBody.notes ?? null,
    };

    const result = validateSchema(payPayableSchema, body);
    if (!('data' in result)) return result;

    const paid = await posPayableService.settlePayable({
      purchaseUuid: uuid,
      amount: Number(result.data.amount),
      notes: result.data.notes || null,
      userId: context.userId,
    });

    return successResponse('Debt payment recorded successfully', paid);
  })
);
