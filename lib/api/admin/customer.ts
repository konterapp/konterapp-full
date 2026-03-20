export interface Customer {
  uuid: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomersResponse {
  status: string;
  message: string;
  data: {
    data: Customer[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  };
}

export async function getCustomers(
  page = 1,
  perPage = 10,
  search = ''
): Promise<CustomersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    search,
  });

  const response = await fetch(`/api/admin/pos/customers?${params}`);
  return response.json();
}

export async function searchCustomers(search: string): Promise<{ status: string; data: Customer[] }> {
  const response = await getCustomers(1, 10, search);
  return {
    status: response.status,
    data: response.data?.data || [],
  };
}

export async function getCustomer(uuid: string): Promise<{ status: string; data: Customer }> {
  const response = await fetch(`/api/admin/pos/customers/${uuid}`);
  return response.json();
}

export async function createCustomer(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<{ status: string; data: Customer }> {
  const response = await fetch('/api/admin/pos/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
