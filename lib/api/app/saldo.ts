export interface SaldoBalanceBranch {
  uuid: string;
  code: string;
  name: string;
}

export interface SaldoBalanceGroup {
  uuid: string;
  name: string | null;
  account_number: string | null;
  account_name: string | null;
  balance: number;
  branches: SaldoBalanceBranch[];
  created_at: string;
}

export interface SaldoAccount {
  uuid: string;
  code: string;
  name: string;
  type: string;
  description?: string | null;
  balance: number;
  balances_count?: number;
  balances?: SaldoBalanceGroup[];
  is_payment_method: boolean;
  is_active: boolean;
  show_in_shift: boolean;
  sort_order: number;
  is_bank_agent: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaldoMutation {
  uuid: string;
  direction: 'in' | 'out';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type: string;
  reference_uuid: string | null;
  notes: string | null;
  saldo_balance: { uuid: string; name: string | null } | null;
  branch: { uuid: string; name: string; code: string } | null;
  creator: { id: number; name: string } | null;
  created_at: string;
}

export interface PaymentMethodOption {
  uuid: string;
  code: string;
  name: string;
  type: string;
}

/**
 * Khusus buat halaman Kasir pilih metode bayar -- cukup permission
 * pos.sale.create (dimiliki role Kasir), bukan pos.saldo.index (permission
 * kelola menu Saldo yang sengaja tidak diberikan ke Kasir default).
 */
export async function getPaymentMethodOptions(): Promise<{ status: string; data: PaymentMethodOption[] }> {
  const response = await fetch('/api/app/pos/saldo/payment-methods');
  return response.json();
}

export async function getAllSaldoAccounts(params?: { isPaymentMethod?: boolean }): Promise<{ status: string; data: { data: SaldoAccount[] } }> {
  const query = params?.isPaymentMethod !== undefined ? `?is_payment_method=${params.isPaymentMethod}&per_page=100` : '?per_page=100';
  const response = await fetch(`/api/app/pos/saldo${query}`);
  return response.json();
}

export async function getSaldoAccount(uuid: string): Promise<{ status: string; message?: string; data: SaldoAccount }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}`);
  return response.json();
}

export async function createSaldoAccount(data: {
  code: string;
  name: string;
  type: string;
  account_number?: string;
  account_name?: string;
  description?: string;
  is_payment_method?: boolean;
  is_active?: boolean;
  show_in_shift?: boolean;
  sort_order?: number;
  is_bank_agent?: boolean;
  opening_balance?: number;
}): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: SaldoAccount }> {
  const response = await fetch('/api/app/pos/saldo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateSaldoAccount(
  uuid: string,
  data: {
    code?: string;
    name?: string;
    type?: string;
    description?: string;
    is_payment_method?: boolean;
    is_active?: boolean;
    show_in_shift?: boolean;
    sort_order?: number;
    is_bank_agent?: boolean;
  }
): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: SaldoAccount }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function moveSaldoAccount(
  uuid: string,
  direction: 'up' | 'down'
): Promise<{ status: string; message?: string }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction }),
  });
  return response.json();
}

export async function deleteSaldoAccount(uuid: string): Promise<{ status: string; message?: string }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function addSaldoBalanceGroup(
  uuid: string,
  data: {
    name?: string;
    account_number?: string;
    account_name?: string;
    branch_uuids: string[];
    opening_balance?: number;
    notes?: string;
  }
): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: SaldoAccount }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}/balances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateSaldoBalanceGroup(
  balanceUuid: string,
  data: { name?: string; account_number?: string; account_name?: string; branch_uuids: string[] }
): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: SaldoAccount }> {
  const response = await fetch(`/api/app/pos/saldo/balances/${balanceUuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteSaldoBalanceGroup(balanceUuid: string): Promise<{ status: string; message?: string }> {
  const response = await fetch(`/api/app/pos/saldo/balances/${balanceUuid}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getSaldoMutations(
  uuid: string,
  page = 1,
  balanceUuid?: string
): Promise<{ status: string; data: { data: SaldoMutation[]; pagination: { page: number; perPage: number; total: number; totalPages: number } } }> {
  const params = new URLSearchParams({ page: page.toString() });
  if (balanceUuid) params.set('balance_uuid', balanceUuid);
  const response = await fetch(`/api/app/pos/saldo/${uuid}/mutations?${params}`);
  return response.json();
}

export async function adjustSaldoBalance(
  balanceUuid: string,
  data: { direction: 'in' | 'out'; amount: number; notes: string; branch_uuid?: string | null }
): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: SaldoAccount }> {
  const response = await fetch(`/api/app/pos/saldo/balances/${balanceUuid}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
