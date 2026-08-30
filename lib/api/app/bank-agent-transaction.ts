export interface BankAgentTransactionType {
  code: string;
  label: string;
  cash_direction: 'in' | 'out' | 'neutral';
}

export interface BankAgentTransaction {
  uuid: string;
  transaction_number: string;
  transaction_type: string;
  cash_direction: 'in' | 'out' | 'neutral';
  account_reference: string | null;
  base_amount: number;
  selling_amount: number;
  fee: number;
  admin_fee: number;
  net_profit: number;
  fee_received_via: string | null;
  payment_method: { uuid: string; code: string; name: string; type: string } | null;
  paid_amount: number;
  change_amount: number;
  notes: string | null;
  branch: { uuid: string; name: string; code: string } | null;
  account: { uuid: string; code: string; name: string } | null;
  creator: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

export async function getBankAgentTransactionTypes(): Promise<{ status: string; data: BankAgentTransactionType[] }> {
  const response = await fetch('/api/app/pos/bank-agent-transactions/types');
  return response.json();
}

export async function getBankAgentTransactions(params: {
  page: number;
  perPage: number;
  search?: string;
  branchUuid?: string;
}): Promise<{
  status: string;
  data: { data: BankAgentTransaction[]; pagination: { page: number; perPage: number; total: number; totalPages: number } };
}> {
  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(params.perPage),
    search: params.search || '',
  });
  if (params.branchUuid) query.set('branch_uuid', params.branchUuid);
  const response = await fetch(`/api/app/pos/bank-agent-transactions?${query.toString()}`);
  return response.json();
}

export async function getBankAgentTransaction(uuid: string): Promise<{ status: string; message?: string; data: BankAgentTransaction }> {
  const response = await fetch(`/api/app/pos/bank-agent-transactions/${uuid}`);
  return response.json();
}

export async function createBankAgentTransaction(data: {
  branch_uuid: string;
  saldo_account_uuid: string;
  transaction_type: string;
  account_reference?: string;
  base_amount: number;
  selling_amount: number;
  fee?: number;
  admin_fee?: number;
  fee_received_via?: string;
  payment_method_uuid: string;
  paid_amount?: number;
  notes?: string;
}): Promise<{ status: string; message?: string; errors?: Record<string, string[]>; data: BankAgentTransaction }> {
  const response = await fetch('/api/app/pos/bank-agent-transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
