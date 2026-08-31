export interface PpobTransactionType {
  uuid: string;
  name: string;
  cash_direction: 'in' | 'out';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PpobTransaction {
  uuid: string;
  transaction_number: string;
  cash_direction: 'in' | 'out';
  account_reference: string | null;
  base_amount: number;
  selling_amount: number;
  admin_fee: number;
  net_profit: number;
  payment_method: { uuid: string; code: string; name: string; type: string } | null;
  paid_amount: number;
  change_amount: number;
  notes: string | null;
  branch: { uuid: string; name: string; code: string } | null;
  account: { uuid: string; code: string; name: string } | null;
  transaction_type: { uuid: string; name: string; cash_direction: 'in' | 'out' } | null;
  creator: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export async function getPpobTransactionTypes(): Promise<{ status: string; data: PpobTransactionType[] }> {
  const response = await fetch('/api/app/pos/ppob-transactions/types');
  return response.json();
}

export async function createPpobTransactionType(data: {
  name: string;
  cash_direction: 'in' | 'out';
  is_active?: boolean;
  sort_order?: number;
}): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: PpobTransactionType }> {
  const response = await fetch('/api/app/pos/ppob-transactions/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updatePpobTransactionType(
  uuid: string,
  data: { name?: string; cash_direction?: 'in' | 'out'; is_active?: boolean; sort_order?: number }
): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: PpobTransactionType }> {
  const response = await fetch(`/api/app/pos/ppob-transactions/types/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deletePpobTransactionType(uuid: string): Promise<{ status: string; message?: string }> {
  const response = await fetch(`/api/app/pos/ppob-transactions/types/${uuid}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function getPpobTransactions(params: {
  page: number;
  perPage: number;
  search?: string;
  branchUuid?: string;
}): Promise<{
  status: string;
  data: { data: PpobTransaction[]; pagination: { page: number; perPage: number; total: number; totalPages: number } };
}> {
  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(params.perPage),
    search: params.search || '',
  });
  if (params.branchUuid) query.set('branch_uuid', params.branchUuid);
  const response = await fetch(`/api/app/pos/ppob-transactions?${query.toString()}`);
  return response.json();
}

export async function getPpobTransaction(uuid: string): Promise<{ status: string; message?: string; data: PpobTransaction }> {
  const response = await fetch(`/api/app/pos/ppob-transactions/${uuid}`);
  return response.json();
}

export async function createPpobTransaction(data: {
  branch_uuid: string;
  saldo_account_uuid: string;
  transaction_type_uuid: string;
  account_reference?: string;
  base_amount: number;
  selling_amount: number;
  admin_fee?: number;
  payment_method_uuid: string;
  paid_amount?: number;
  notes?: string;
}): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: PpobTransaction }> {
  const response = await fetch('/api/app/pos/ppob-transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
