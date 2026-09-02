import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createBankAgentTransactionSchema } from '@/lib/validations/bank-agent-transaction';
import { posBankAgentTransactionService } from '@/lib/modules/pos/bank-agent-transactions/admin.service';

export const GET = withPermission(
  'pos.bank-agent-transaction.index',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const branchUuid = searchParams.get('branch_uuid') || '';

    const result = await posBankAgentTransactionService.listTransactions({
      page,
      perPage,
      search,
      branchUuid,
      companyUuid: context.companyUuid,
      userId: context.userId,
    });

    return successResponse('Daftar transaksi berhasil dimuat', result);
  })
);

export const POST = withPermission(
  'pos.bank-agent-transaction.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      branchUuid: rawBody.branchUuid ?? rawBody.branch_uuid,
      saldoAccountUuid: rawBody.saldoAccountUuid ?? rawBody.saldo_account_uuid,
      transactionTypeUuid: rawBody.transactionTypeUuid ?? rawBody.transaction_type_uuid,
      accountReference: rawBody.accountReference ?? rawBody.account_reference,
      baseAmount: rawBody.baseAmount ?? rawBody.base_amount,
      sellingAmount: rawBody.sellingAmount ?? rawBody.selling_amount,
      adminFee: rawBody.adminFee ?? rawBody.admin_fee,
      feeReceivedVia: rawBody.feeReceivedVia ?? rawBody.fee_received_via,
      paymentMethodUuid: rawBody.paymentMethodUuid ?? rawBody.payment_method_uuid,
      paidAmount: rawBody.paidAmount ?? rawBody.paid_amount,
    };

    const result = validateSchema(createBankAgentTransactionSchema, body);
    if (!('data' in result)) return result;

    const transaction = await posBankAgentTransactionService.createTransaction(
      context.companyUuid,
      context.userId,
      result.data
    );
    return successResponse('Transaksi berhasil dibuat', transaction);
  })
);
