import { apiRequest, ApiResponse } from '../api';

export interface BillingPlan {
  uuid: string;
  code: string;
  name: string;
  price: number;
  duration_days: number;
}

export interface BillingSubscription {
  plan: BillingPlan;
  status: string;
  started_at: string;
  expires_at: string;
}

export interface BillingInvoice {
  uuid: string;
  plan: BillingPlan;
  amount: number;
  coupon_code: string | null;
  discount_amount: number | null;
  status: string;
  payment_link: string | null;
  paid_at: string | null;
  expired_at: string | null;
  created_at: string;
}

export interface BillingStatus {
  subscription: BillingSubscription | null;
  invoices: BillingInvoice[];
}

export interface CouponApplyResult {
  code: string;
  name: string;
  plan_code: string | null;
  discount_percent: number;
  discount_amount: number;
  subtotal: number;
  final_amount: number;
}

export async function getBillingStatus(): Promise<ApiResponse<BillingStatus>> {
  return apiRequest<BillingStatus>('/api/app/billing');
}

export async function createCheckoutInvoice(
  planCode: string,
  couponCode?: string | null
): Promise<ApiResponse<BillingInvoice>> {
  return apiRequest<BillingInvoice>('/api/app/billing/checkout', {
    method: 'POST',
    data: { plan_code: planCode, coupon_code: couponCode || null },
  });
}

export async function applyCoupon(code: string, planCode: string): Promise<ApiResponse<CouponApplyResult>> {
  return apiRequest<CouponApplyResult>('/api/app/billing/coupon', {
    method: 'POST',
    data: { code, plan_code: planCode },
  });
}

export async function cancelCheckoutInvoice(invoiceUuid: string): Promise<ApiResponse<BillingInvoice>> {
  return apiRequest<BillingInvoice>(`/api/app/billing/invoices/${invoiceUuid}/cancel`, {
    method: 'POST',
  });
}
