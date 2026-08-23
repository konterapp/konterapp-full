export interface SaldoAccount {
  uuid: string;
  code: string;
  name: string;
  type: string;
  account_number?: string | null;
  account_name?: string | null;
  description?: string | null;
  balance: number;
  is_payment_method: boolean;
  is_active: boolean;
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
  branch: { uuid: string; name: string; code: string } | null;
  creator: { id: number; name: string } | null;
  created_at: string;
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
    account_number?: string;
    account_name?: string;
    description?: string;
    is_payment_method?: boolean;
    is_active?: boolean;
  }
): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: SaldoAccount }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteSaldoAccount(uuid: string): Promise<{ status: string; message?: string }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getSaldoMutations(
  uuid: string,
  page = 1
): Promise<{ status: string; data: { data: SaldoMutation[]; pagination: { page: number; perPage: number; total: number; totalPages: number } } }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}/mutations?page=${page}`);
  return response.json();
}

export async function adjustSaldoBalance(
  uuid: string,
  data: { direction: 'in' | 'out'; amount: number; notes: string; branch_uuid?: string | null }
): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: SaldoAccount }> {
  const response = await fetch(`/api/app/pos/saldo/${uuid}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
