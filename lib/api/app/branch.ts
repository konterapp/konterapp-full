export interface Branch {
  uuid: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAllBranches(): Promise<{ status: string; data: Branch[] }> {
  const response = await fetch('/api/app/pos/branches');
  return response.json();
}

export async function getBranch(uuid: string): Promise<{ status: string; data: Branch }> {
  const response = await fetch(`/api/app/pos/branches/${uuid}`);
  return response.json();
}

export async function createBranch(data: {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  is_main?: boolean;
}): Promise<{ status: string; data: Branch }> {
  const response = await fetch('/api/app/pos/branches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateBranch(
  uuid: string,
  data: {
    code?: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
    is_main?: boolean;
  }
): Promise<{ status: string; data: Branch }> {
  const response = await fetch(`/api/app/pos/branches/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteBranch(uuid: string): Promise<{ status: string }> {
  const response = await fetch(`/api/app/pos/branches/${uuid}`, {
    method: 'DELETE',
  });
  return response.json();
}
