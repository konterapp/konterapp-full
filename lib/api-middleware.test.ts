import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, getResponseJson } from '@/__tests__/test-utils';
import { billingRepository } from '@/lib/modules/billing/repository';

vi.mock('@/lib/auth-config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/permissions', () => ({
  getUserPermissions: vi.fn(),
  hasPermission: vi.fn(),
}));

vi.mock('@/lib/company-access', () => ({
  resolveUserActiveCompany: vi.fn(),
}));

vi.mock('@/lib/tenant-context', () => ({
  runWithTenantContext: vi.fn(),
}));

vi.mock('@/lib/modules/billing/repository', () => ({
  billingRepository: {
    findSubscriptionByCompanyUuid: vi.fn(),
  },
}));

import { auth } from '@/lib/auth-config';
import { getUserPermissions, hasPermission } from '@/lib/permissions';
import { resolveUserActiveCompany } from '@/lib/company-access';
import { runWithTenantContext } from '@/lib/tenant-context';
import { withPermission } from './api-middleware';
import { successResponse } from './response';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetUserPermissions = getUserPermissions as unknown as ReturnType<typeof vi.fn>;
const mockHasPermission = hasPermission as unknown as ReturnType<typeof vi.fn>;
const mockResolveUserActiveCompany = resolveUserActiveCompany as unknown as ReturnType<typeof vi.fn>;
const mockRunWithTenantContext = runWithTenantContext as unknown as ReturnType<typeof vi.fn>;
const mockFindSubscription = billingRepository.findSubscriptionByCompanyUuid as unknown as ReturnType<typeof vi.fn>;

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: '1' } });
  mockResolveUserActiveCompany.mockResolvedValue({
    activeCompanyUuid: 'company-1',
    companies: [],
  });
  mockRunWithTenantContext.mockImplementation((_companyUuid, callback) => callback());
  mockGetUserPermissions.mockResolvedValue(['admin.pos.sale.index']);
  mockHasPermission.mockReturnValue(true);
});

function gatedHandler() {
  return withPermission('admin.pos.sale.index', async () => successResponse('ok'));
}

function gatedContext(): { params: Promise<Record<string, string>> } {
  return { params: Promise.resolve({}) };
}

describe('withPermission subscription gate', () => {
  it('allows access when subscription is active', async () => {
    mockFindSubscription.mockResolvedValue({ status: 'active', expiresAt: daysFromNow(30) });

    const res = await gatedHandler()(createMockRequest('/api/app/pos/transactions'), gatedContext());
    const json = await getResponseJson(res);

    expect(res.status).toBe(200);
    expect(json.status).toBe('success');
  });

  it('allows access when free trial is still running', async () => {
    mockFindSubscription.mockResolvedValue({ status: 'trial', expiresAt: daysFromNow(5) });

    const res = await gatedHandler()(createMockRequest('/api/app/pos/transactions'), gatedContext());

    expect(res.status).toBe(200);
  });

  it('blocks access when subscription is expired', async () => {
    mockFindSubscription.mockResolvedValue({ status: 'trial', expiresAt: daysFromNow(-1) });

    const res = await gatedHandler()(createMockRequest('/api/app/pos/transactions'), gatedContext());
    const json = await getResponseJson(res);

    expect(res.status).toBe(403);
    expect(json.status).toBe('error');
    expect(mockGetUserPermissions).not.toHaveBeenCalled();
  });

  it('blocks access when subscription is missing', async () => {
    mockFindSubscription.mockResolvedValue(null);

    const res = await gatedHandler()(createMockRequest('/api/app/pos/transactions'), gatedContext());

    expect(res.status).toBe(403);
  });

  it('blocks access when subscription status is not active (canceled)', async () => {
    mockFindSubscription.mockResolvedValue({ status: 'canceled', expiresAt: daysFromNow(30) });

    const res = await gatedHandler()(createMockRequest('/api/app/pos/transactions'), gatedContext());

    expect(res.status).toBe(403);
  });
});
