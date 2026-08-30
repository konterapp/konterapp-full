import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withPermission } from '@/lib/api-middleware';
import { withApiErrorHandling } from '@/lib/api-error-handler';
import { validateSchema } from '@/lib/validation';
import { createSaldoAccountSchema } from '@/lib/validations/saldo';
import { posSaldoService } from '@/lib/modules/pos/saldo/admin.service';

export const GET = withPermission(
  'pos.saldo.index',
  withApiErrorHandling(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('is_active');
    const isPaymentMethod = searchParams.get('is_payment_method');
    const sortBy = searchParams.get('sort_by') || 'sort_order';
    const sortOrder = searchParams.get('sort_order') || 'asc';

    const result = await posSaldoService.listAccounts({
      page,
      perPage,
      search,
      isActive,
      isPaymentMethod,
      sortBy,
      sortOrder,
    });

    return successResponse('Daftar akun saldo berhasil dimuat', result);
  })
);

export const POST = withPermission(
  'pos.saldo.create',
  withApiErrorHandling(async (req: NextRequest, context) => {
    const rawBody = await req.json();
    const body = {
      ...rawBody,
      accountNumber: rawBody.accountNumber ?? rawBody.account_number,
      accountName: rawBody.accountName ?? rawBody.account_name,
      isPaymentMethod: rawBody.isPaymentMethod ?? rawBody.is_payment_method,
      isActive: rawBody.isActive ?? rawBody.is_active,
      showInShift: rawBody.showInShift ?? rawBody.show_in_shift,
      sortOrder: rawBody.sortOrder ?? rawBody.sort_order,
      openingBalance: rawBody.openingBalance ?? rawBody.opening_balance,
    };

    const result = validateSchema(createSaldoAccountSchema, body);
    if (!('data' in result)) return result;

    const account = await posSaldoService.createAccount(context.companyUuid, context.userId, result.data);
    return successResponse('Akun saldo berhasil dibuat', account);
  })
);
