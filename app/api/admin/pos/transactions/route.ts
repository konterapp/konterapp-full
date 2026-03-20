import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { posTransactionService } from '@/lib/modules/pos/transactions/admin.service';

export const GET = withPermission(
  'admin.pos.sale.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid');
    const paymentMethodUuid = searchParams.get('payment_method_uuid');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const paymentStatus = searchParams.get('payment_status');
    const sortBy = searchParams.get('sort_by');
    const sortOrder = searchParams.get('sort_order') === 'asc' ? 'asc' : 'desc';

    const result = await posTransactionService.listTransactions({
      page,
      perPage,
      search,
      branchUuid,
      paymentMethodUuid,
      startDate,
      endDate,
      paymentStatus,
      sortBy,
      sortOrder,
    });

    return successResponse('Transactions retrieved successfully', result);
  })
);

export const POST = withPermission(
  'admin.pos.sale.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      branchUuid: rawBody.branchUuid ?? rawBody.branch_uuid,
      customerUuid: typeof (rawBody.customerUuid ?? rawBody.customer_uuid) === 'string'
        ? (rawBody.customerUuid ?? rawBody.customer_uuid).trim()
        : rawBody.customerUuid ?? rawBody.customer_uuid,
      paymentMethodUuid: rawBody.paymentMethodUuid ?? rawBody.payment_method_uuid,
      saleDate: rawBody.saleDate ?? rawBody.sale_date,
      discountAmount: rawBody.discountAmount ?? rawBody.discount_amount,
      paidAmount: rawBody.paidAmount ?? rawBody.paid_amount,
      items: Array.isArray(rawBody.items)
        ? rawBody.items.map((item: any) => ({
            ...item,
            productUuid: item.productUuid ?? item.product_uuid,
            unit_price: item.unit_price ?? item.unitPrice,
          }))
        : rawBody.items,
    };
    const sale = await posTransactionService.createSale(body, context.userId);
    return successResponse('Sale created successfully', sale);
  })
);
