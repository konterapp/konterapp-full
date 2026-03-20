import { describe, it, expect, vi } from 'vitest';
import { createMockRequest, createMockContext, getResponseJson, SuccessResponse, PaginatedResponse } from '@/__tests__/test-utils';

vi.mock('@/lib/api-middleware', () => ({
  withPermission: (_perm: string, handler: any) => handler,
}));

vi.mock('@/lib/api-error-handler', () => ({
  withApiErrorHandling: (handler: any) => handler,
}));

vi.mock('@/lib/validation', () => ({
  validateSchema: vi.fn().mockReturnValue({ data: { title: 'Test Berita', content: 'Test content', news_type: 'artikel', is_published: true } }),
}));

vi.mock('@/lib/modules/berita/admin.service', () => ({
  beritaService: {
    listBerita: vi.fn().mockResolvedValue({
      items: [{ id: 1, uuid: 'berita-1', title: 'Test Berita', slug: 'test-berita' }],
      page: 1,
      perPage: 10,
      total: 1,
    }),
    createBerita: vi.fn().mockResolvedValue({ id: 1, uuid: 'berita-1', title: 'Test Berita', slug: 'test-berita' }),
  },
}));

import { GET, POST } from './route';

describe('GET /api/admin/berita', () => {
  it('returns paginated berita list', async () => {
    const req = createMockRequest('/api/admin/berita', {
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

describe('POST /api/admin/berita', () => {
  it('creates berita on valid payload', async () => {
    const payload = {
      title: 'Test Berita',
      content: 'Test content',
      news_type: 'artikel',
      is_published: true,
    };

    const req = createMockRequest('/api/admin/berita', {
      method: 'POST',
      body: payload,
    });

    const res = await POST(req, createMockContext());
    const json = await getResponseJson<SuccessResponse>(res);

    expect(json.status).toBe('success');
    expect(json.data).toMatchObject({ uuid: 'berita-1', title: 'Test Berita' });
  });
});
