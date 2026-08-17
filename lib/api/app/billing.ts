import { apiRequest, ApiResponse } from '../api';

export interface BillingPlan {
  uuid: string;
  code: string;
  name: string;
  tier_code: string | null;
  tier_name: string | null;
  billing_period: string | null;
  price: number;
  duration_days: number | null;
}

export interface PlanCatalogItem {
  uuid: string;
  code: string;
  name: string;
  billing_period: string | null;
  price: number;
  duration_days: number | null;
}

export interface PlanTier {
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  max_branches: number | null;
  max_users: number | null;
  max_products: number | null;
  max_transactions_per_month: number | null;
  features: string[];
  display_order: number;
  plans: PlanCatalogItem[];
}

export interface BillingSubscription {
  plan: BillingPlan;
  status: string;
  started_at: string;
  expires_at: string | null;
}

export interface BillingInvoice {
  uuid: string;
  plan: BillingPlan;
  amount: number;
  coupon_code: string | null;
  discount_amount: number | null;
  referral_code: string | null;
  referral_discount_amount: number | null;
  referral_balance_used: number | null;
  status: string;
  payment_link: string | null;
  paid_at: string | null;
  expired_at: string | null;
  created_at: string;
}

export interface BillingStatus {
  subscription: BillingSubscription | null;
  invoices: BillingInvoice[];
  referral_balance: number;
  referred_by: number | null;
}

export interface CouponApplyResult {
  code: string;
  name: string;
  plan_code: string | null;
  discount_percent: number;
  discount_amount: number;
  subtotal: number;
  final_amount: number;
  is_referral?: boolean;
  auto?: boolean;
}

export async function getBillingStatus(): Promise<ApiResponse<BillingStatus>> {
  return apiRequest<BillingStatus>('/api/app/billing');
}

export async function getPlans(): Promise<ApiResponse<PlanTier[]>> {
  return apiRequest<PlanTier[]>('/api/app/billing/plans');
}

export async function createCheckoutInvoice(
  planCode: string,
  couponCode?: string | null,
  useReferralBalance?: boolean
): Promise<ApiResponse<BillingInvoice>> {
  return apiRequest<BillingInvoice>('/api/app/billing/checkout', {
    method: 'POST',
    data: {
      plan_code: planCode,
      coupon_code: couponCode || null,
      use_referral_balance: Boolean(useReferralBalance),
    },
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
