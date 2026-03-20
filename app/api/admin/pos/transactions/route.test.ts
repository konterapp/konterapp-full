import { describe, it, expect, vi } from 'vitest';
import { createMockRequest, createMockContext, getResponseJson, SuccessResponse } from '@/__tests__/test-utils';

vi.mock('@/lib/api-middleware', () => ({
  withPermission: (_perm: string, handler: any) => handler,
}));

vi.mock('@/lib/api-error-handler', () => ({
  withApiErrorHandling: (handler: any) => handler,
}));

vi.mock('@/lib/modules/pos/transactions/admin.service', () => ({
  posTransactionService: {
    createSale: vi.fn().mockResolvedValue({ uuid: 'sale-1' }),
  },
}));

import { POST } from './route';

describe('POST /api/admin/pos/transactions', () => {
  it('returns success on valid payload', async () => {
    const payload = {
      branch_uuid: 'branch-1',
      payment_method_uuid: 'pm-1',
      sale_date: '2026-03-20',
      paid_amount: 10000,
      items: [{ product_uuid: 'prod-1', quantity: 1, unit_price: 10000 }],
    };

    const req = createMockRequest('/api/admin/pos/transactions', {
      method: 'POST',
      body: payload,
    });

    const res = await POST(req, createMockContext());
    const json = await getResponseJson<SuccessResponse>(res);

    expect(json.status).toBe('success');
    expect(json.data).toMatchObject({ uuid: 'sale-1' });
  });
});
