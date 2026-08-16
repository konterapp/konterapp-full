import { apiRequest, ApiResponse, PaginatedData } from '../api';

export interface Coupon {
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  plan_code: string | null;
  discount_percent: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponFormData {
  code: string;
  name: string;
  description?: string;
  plan_code?: string | null;
  discount_percent: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  is_active?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
}

export async function getCouponsList(
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  status: string = '',
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<PaginatedData<Coupon>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);

  return apiRequest<PaginatedData<Coupon>>(`/api/administrator/coupons?${params.toString()}`);
}

export async function getCoupon(uuid: string): Promise<ApiResponse<Coupon>> {
  return apiRequest<Coupon>(`/api/administrator/coupons/${uuid}`);
}

export async function createCoupon(data: CouponFormData): Promise<ApiResponse<Coupon>> {
  return apiRequest<Coupon>('/api/administrator/coupons', {
    method: 'POST',
    data,
  });
}

export async function updateCoupon(uuid: string, data: Partial<CouponFormData>): Promise<ApiResponse<Coupon>> {
  return apiRequest<Coupon>(`/api/administrator/coupons/${uuid}`, {
    method: 'PATCH',
    data,
  });
}

export async function deleteCoupon(uuid: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/api/administrator/coupons/${uuid}`, {
    method: 'DELETE',
  });
}
