export interface TenantCompany {
  uuid: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTenantCompany(): Promise<{ status: string; message?: string; data?: TenantCompany }> {
  const response = await fetch('/api/app/company');
  return response.json();
}

export async function updateTenantCompany(data: {
  name: string;
}): Promise<{ status: string; message?: string; data?: TenantCompany }> {
  const response = await fetch('/api/app/company', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
