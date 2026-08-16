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

export async function getBillingStatus(): Promise<ApiResponse<BillingStatus>> {
  return apiRequest<BillingStatus>('/api/app/billing');
}

export async function createCheckoutInvoice(): Promise<ApiResponse<BillingInvoice>> {
  return apiRequest<BillingInvoice>('/api/app/billing/checkout', {
    method: 'POST',
  });
}
