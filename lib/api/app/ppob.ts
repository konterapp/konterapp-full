import { apiRequest, ApiResponse } from '../api';

// Raw provider API response (RajaBiller / Digiflazz)
export interface ProviderResponse {
  STATUS?: string;
  KET?: string;
  [key: string]: unknown;
}

// Product stored in local database (from pos_ppob_products)
export interface PpobProductLocal {
  uuid: string;
  provider: string;
  provider_label: string;
  provider_product_code: string;
  product_name: string;
  brand: string | null;
  category: string;
  type: string;
  seller_name: string | null;
  base_price: number;
  admin_fee: number;
  selling_price: number;
  digiflazz_type: string | null;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string | null;
  end_cut_off: string | null;
  desc: string | null;
  is_active: boolean;
  provider_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Inquiry result from provider (RajaBiller format — Digiflazz returns similar mapped by backend)
export interface PpobInquiryResult {
  STATUS: string;
  KET: string;
  IDPEL1?: string;
  NAMA?: string;
  TAGIHAN?: string;
  ADMIN?: string;
  TOTAL?: string;
  REF1?: string;
  REF2?: string;
  REF3?: string;
  [key: string]: unknown;
}

export interface PpobTransaction {
  uuid: string;
  transaction_number: string;
  type: string;
  product_code: string;
  product_name: string;
  customer_number: string;
  customer_name: string | null;
  amount: number;
  admin_fee: number;
  selling_price: number;
  profit: number;
  provider: string;
  provider_label: string;
  status: string;
  status_label: string;
  provider_reference: string | null;
  provider_response: Record<string, unknown> | null;
  notes: string | null;
  branch_uuid: string;
  branch?: { uuid: string; name: string };
  payment_method_uuid: string;
  payment_method?: { uuid: string; name: string; type: string };
  created_by: number;
  creator?: { id: number; name: string; email: string };
  created_at: string;
  updated_at: string;
}

// ─── Product CRUD (local DB) ────────────────────────────────────

export async function getPpobProductsByCategory(category: string, brand?: string): Promise<ApiResponse<PpobProductLocal[]>> {
  const params = new URLSearchParams({ category });
  if (brand) params.append('brand', brand);
  return apiRequest<PpobProductLocal[]>(`/api/app/pos/ppob-products/by-category?${params.toString()}`);
}

export async function getPpobBrandsByCategory(category: string): Promise<ApiResponse<string[]>> {
  return apiRequest<string[]>(`/api/app/pos/ppob-products/brands-by-category?category=${encodeURIComponent(category)}`);
}

export async function getPpobProductsList(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  provider?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<ApiResponse<PpobProductLocal[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.provider) searchParams.append('provider', params.provider);
  if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active ? '1' : '0');
  if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params?.sort_order) searchParams.append('sort_order', params.sort_order);

  return apiRequest<PpobProductLocal[]>(`/api/app/pos/ppob-products?${searchParams.toString()}`);
}

export async function createPpobProduct(data: {
  provider: string;
  provider_product_code: string;
  product_name: string;
  category: string;
  type: string;
  base_price: number;
  admin_fee?: number;
  selling_price: number;
  is_active?: boolean;
}): Promise<ApiResponse<PpobProductLocal>> {
  return apiRequest<PpobProductLocal>('/api/app/pos/ppob-products', {
    method: 'POST',
    data,
  });
}

export async function updatePpobProduct(uuid: string, data: Partial<{
  provider: string;
  provider_product_code: string;
  product_name: string;
  category: string;
  type: string;
  base_price: number;
  admin_fee: number;
  selling_price: number;
  is_active: boolean;
}>): Promise<ApiResponse<PpobProductLocal>> {
  return apiRequest<PpobProductLocal>(`/api/app/pos/ppob-products/${uuid}`, {
    method: 'PATCH',
    data,
  });
}

export async function deletePpobProduct(uuid: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/api/app/pos/ppob-products/${uuid}`, {
    method: 'DELETE',
  });
}

export async function syncPpobProducts(provider: string, category: string): Promise<ApiResponse<never>> {
  return apiRequest<never>('/api/app/pos/ppob-products/sync', {
    method: 'POST',
    data: { provider, category },
  });
}

export async function syncAllDigiflazz(): Promise<ApiResponse<Record<string, number>>> {
  return apiRequest<Record<string, number>>('/api/app/pos/ppob-products/sync-all', {
    method: 'POST',
  });
}

// ─── Inquiry ─────────────────────────────────────────────────────

export async function inquiryBill(
  productCode: string,
  customerNumber: string,
  idpel2?: string,
  idpel3?: string,
  periode?: string,
): Promise<ProviderResponse> {
  const response = await apiRequest<never>('/api/app/pos/ppob/inquiry', {
    method: 'POST',
    data: {
      product_code: productCode,
      customer_number: customerNumber,
      idpel2: idpel2 || '',
      idpel3: idpel3 || '',
      periode: periode || '',
    },
  });
  return response as unknown as ProviderResponse;
}

// ─── Purchase / Pay ──────────────────────────────────────────────

export interface PurchasePrepaidData {
  branch_uuid: string;
  product_code: string;
  product_name: string;
  customer_number: string;
  amount: number;
  selling_price: number;
  payment_method_uuid: string;
  notes?: string;
}

export async function purchasePrepaid(data: PurchasePrepaidData): Promise<ApiResponse<PpobTransaction>> {
  return apiRequest<PpobTransaction>('/api/app/pos/ppob/purchase', {
    method: 'POST',
    data,
  });
}

export interface PayPostpaidData {
  branch_uuid: string;
  product_code: string;
  product_name: string;
  customer_number: string;
  customer_name?: string;
  amount: number;
  admin_fee?: number;
  selling_price: number;
  nominal: string;
  payment_method_uuid: string;
  ref2?: string;
  ref3?: string;
  idpel2?: string;
  idpel3?: string;
  bpjs_idpel1?: string;
  no_hp?: string;
  notes?: string;
}

export async function payPostpaid(data: PayPostpaidData): Promise<ApiResponse<PpobTransaction>> {
  return apiRequest<PpobTransaction>('/api/app/pos/ppob/pay', {
    method: 'POST',
    data,
  });
}

// ─── Transactions ────────────────────────────────────────────────

export async function getPpobTransactions(
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  status?: string,
  type?: string,
  branchUuid?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<ApiResponse<PpobTransaction[]>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (search) params.append('search', search);
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  if (branchUuid) params.append('branch_uuid', branchUuid);
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);

  return apiRequest<PpobTransaction[]>(`/api/app/pos/ppob/transactions?${params.toString()}`);
}

export async function getPpobTransactionDetail(uuid: string): Promise<ApiResponse<PpobTransaction>> {
  return apiRequest<PpobTransaction>(`/api/app/pos/ppob/transactions/${uuid}`);
}

export async function checkPpobTransactionStatus(uuid: string): Promise<ApiResponse<PpobTransaction>> {
  return apiRequest<PpobTransaction>(`/api/app/pos/ppob/transactions/${uuid}/check-status`, {
    method: 'POST',
  });
}

// ─── Balance ─────────────────────────────────────────────────────

export async function getProviderBalance(provider?: string): Promise<ProviderResponse> {
  const params = provider ? `?provider=${provider}` : '';
  const response = await apiRequest<never>(`/api/app/pos/ppob/balance${params}`);
  return response as unknown as ProviderResponse;
}
