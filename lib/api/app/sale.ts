export interface SaleItem {
  product: {
    uuid: string;
    name: string;
    sku: string;
    image?: string | null;
  };
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  uuid: string;
  sale_number: string;
  branch_uuid: string;
  branch?: {
    uuid: string;
    name: string;
    code: string;
  };
  customer_uuid?: string;
  customer?: {
    uuid: string;
    name: string;
    phone?: string;
  };
  payment_method_uuid: string;
  payment_method?: {
    uuid: string;
    name: string;
    code: string;
  };
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_status: string;
  notes?: string;
  // Terisi cuma utk sale sintetis komisi Agen Bank (lihat modul
  // bank-agent-transactions) -- FK asli balik ke transaksi asalnya.
  bank_agent_transaction_uuid?: string | null;
  created_by: number;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  items: SaleItem[];
}

export interface SaleItemCreateData {
  product_uuid: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface CreateSaleData {
  branch_uuid: string;
  customer_uuid?: string;
  payment_method_uuid: string;
  sale_date?: string;
  items: SaleItemCreateData[];
  discount_amount?: number;
  paid_amount: number;
  notes?: string;
}

export async function createSale(data: CreateSaleData): Promise<{ status: string; data: Sale }> {
  const response = await fetch('/api/app/pos/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getTransactions(
  page = 1,
  perPage = 10,
  filters?: {
    search?: string;
    branch_uuid?: string;
    start_date?: string;
    end_date?: string;
    payment_status?: string;
  }
): Promise<{ status: string; data: { data: Sale[]; pagination: Record<string, unknown> } }> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...filters,
  });

  const response = await fetch(`/api/app/pos/transactions?${params}`);
  return response.json();
}

export async function getTransaction(uuid: string): Promise<{ status: string; data: Sale }> {
  const response = await fetch(`/api/app/pos/transactions/${uuid}`);
  return response.json();
}
