import { apiRequest, ApiResponse, PaginatedData } from '../api';

export interface User {
  id: number;
  uuid: string;
  name: string;
  email: string;
  is_active?: boolean;
  email_verified_at?: string | null;
  roles?: string[];
  permissions?: string[];
  companies?: { uuid: string; code: string; name: string; is_default: boolean }[];
  created_at?: string;
  updated_at?: string;
}

export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  company_uuid?: string;
  roles: number | '';
}

export async function getUsers(
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  sortBy: string = 'id',
  sortOrder: 'asc' | 'desc' = 'desc',
  role?: string
): Promise<ApiResponse<PaginatedData<User>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (search) params.append('search', search);
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);
  if (role) params.append('role', role);

  return apiRequest<PaginatedData<User>>(`/api/administrator/users?${params.toString()}`);
}

export async function getUser(uuid: string): Promise<ApiResponse<User>> {
  return apiRequest<User>(`/api/administrator/users/${uuid}`);
}

export async function createUser(data: UserCreateData): Promise<ApiResponse<User>> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return apiRequest<User>('/api/administrator/users', {
    method: 'POST',
    data: formData,
  });
}

export async function updateUser(uuid: string, data: Partial<UserCreateData>): Promise<ApiResponse<User>> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return apiRequest<User>(`/api/administrator/users/${uuid}`, {
    method: 'PATCH',
    data: formData,
  });
}

export async function deleteUser(uuid: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/administrator/users/${uuid}`, {
    method: 'DELETE',
  });
}

export interface Role {
  id: number;
  name: string;
}

export async function getRoles(companyUuid?: string): Promise<ApiResponse<Role[]>> {
  const params = companyUuid ? `?company_uuid=${encodeURIComponent(companyUuid)}` : '';
  return apiRequest<Role[]>(`/api/administrator/users/roles${params}`);
}

export async function toggleUserActive(uuid: string): Promise<ApiResponse<User>> {
  return apiRequest<User>(`/api/administrator/users/${uuid}/toggle-active`, {
    method: 'PATCH',
  });
}

export async function impersonateUser(uuid: string): Promise<ApiResponse<{ impersonating: boolean }>> {
  return apiRequest<{ impersonating: boolean }>(`/api/administrator/users/${uuid}/impersonate`, {
    method: 'POST',
  });
}
