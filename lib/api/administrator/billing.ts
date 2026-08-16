import { apiRequest, ApiResponse, PaginatedData } from '../api';

export interface AdminBillingInvoice {
  uuid: string;
  provider: string;
  provider_invoice_id: string;
  provider_transaction_id?: string | null;
  company: { uuid: string; code: string; name: string };
  plan: { uuid: string; code: string; name: string; price: number; duration_days: number };
  amount: number;
  coupon_code?: string | null;
  discount_amount?: number | null;
  status: string;
  payment_link?: string | null;
  paid_at?: string | null;
  expired_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export async function getBillingInvoicesList(
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  status: string = '',
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<PaginatedData<AdminBillingInvoice>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (search) params.append('search', search);
  if (status) params.append('status', status);
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);

  return apiRequest<PaginatedData<AdminBillingInvoice>>(
    `/api/administrator/billing?${params.toString()}`
  );
}

export async function getBillingInvoice(uuid: string): Promise<ApiResponse<AdminBillingInvoice>> {
  return apiRequest<AdminBillingInvoice>(`/api/administrator/billing/${uuid}`);
}
