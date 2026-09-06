export interface TenantCompany {
  uuid: string;
  code: string;
  name: string;
  is_active: boolean;
  allow_negative_stock?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosSettings {
  allow_negative_stock: boolean;
}

export async function getPosSettings(): Promise<{ status: string; message?: string; data?: PosSettings }> {
  const response = await fetch('/api/app/pos/settings');
  return response.json();
}

export async function updatePosSettings(data: {
  allow_negative_stock: boolean;
}): Promise<{ status: string; message?: string; data?: PosSettings }> {
  const response = await fetch('/api/app/pos/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
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
