import { describe, it, expect, vi } from 'vitest';
import { createMockRequest, createMockContext, getResponseJson, SuccessResponse, PaginatedResponse } from '@/__tests__/test-utils';

vi.mock('@/lib/api-middleware', () => ({
  withPermission: (_perm: string, handler: any) => handler,
}));

vi.mock('@/lib/api-error-handler', () => ({
  withApiErrorHandling: (handler: any) => handler,
}));

vi.mock('@/lib/validation', () => ({
  validateSchema: vi.fn().mockReturnValue({ data: { name: 'Test User', email: 'test@example.com', password: 'password123', roles: 1 } }),
}));

vi.mock('@/lib/modules/users/admin.service', () => ({
  userService: {
    listUsers: vi.fn().mockResolvedValue({
      users: [{ id: 1, uuid: 'user-1', name: 'Test User', email: 'test@example.com' }],
      page: 1,
      perPage: 10,
      total: 1,
    }),
    createUser: vi.fn().mockResolvedValue({ id: 1, uuid: 'user-1', name: 'Test User', email: 'test@example.com' }),
  },
}));

import { GET, POST } from './route';

describe('GET /api/admin/users', () => {
  it('returns paginated user list', async () => {
    const req = createMockRequest('/api/admin/users', {
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

describe('POST /api/admin/users', () => {
  it('creates user on valid payload', async () => {
    const payload = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      roles: 1,
    };

    const req = createMockRequest('/api/admin/users', {
      method: 'POST',
      body: payload,
    });

    const res = await POST(req, createMockContext());
    const json = await getResponseJson<SuccessResponse>(res);

    expect(json.status).toBe('success');
    expect(json.data).toMatchObject({ uuid: 'user-1', name: 'Test User' });
  });
});
