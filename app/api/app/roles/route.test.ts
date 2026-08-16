import { describe, it, expect, vi } from 'vitest';
import { createMockRequest, createMockContext, getResponseJson, SuccessResponse, PaginatedResponse } from '@/__tests__/test-utils';

vi.mock('@/lib/api-middleware', () => ({
  withPermission: (_perm: string, handler: any) => handler,
}));

vi.mock('@/lib/api-error-handler', () => ({
  withApiErrorHandling: (handler: any) => handler,
}));

vi.mock('@/lib/validation', () => ({
  validateSchema: vi.fn().mockReturnValue({ data: { name: 'Test Role' } }),
}));

vi.mock('@/lib/modules/roles/admin.service', () => ({
  roleService: {
    listRoles: vi.fn().mockResolvedValue({
      roles: [{ id: 1, name: 'Test Role', guard_name: 'api' }],
      page: 1,
      perPage: 10,
      total: 1,
    }),
    createRole: vi.fn().mockResolvedValue({ id: 1, name: 'Test Role', guard_name: 'api' }),
  },
}));

import { GET, POST } from './route';

describe('GET /api/app/roles', () => {
  it('returns paginated role list', async () => {
    const req = createMockRequest('/api/app/roles', {
      method: 'GET',
      searchParams: { page: '1', per_page: '10' },
    });

    const res = await GET(req, createMockContext());
    const json = await getResponseJson<PaginatedResponse>(res);

    expect(json.status).toBe('success');
    expect(json.data).toHaveProperty('data');
    expect(json.data.data).toHaveLength(1);
  });
});

describe('POST /api/app/roles', () => {
  it('creates role on valid payload', async () => {
    const payload = {
      name: 'Test Role',
    };

    const req = createMockRequest('/api/app/roles', {
      method: 'POST',
      body: payload,
    });

    const res = await POST(req, createMockContext());
    const json = await getResponseJson<SuccessResponse>(res);

    expect(json.status).toBe('success');
    expect(json.data).toMatchObject({ name: 'Test Role' });
  });
});
