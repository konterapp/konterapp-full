import { apiRequest, ApiResponse, PaginatedData } from '../api';

export interface Role {
  id: number;
  name: string;
  permissions?: string[];
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoleCreateData {
  name: string;
  permissions?: string[];
}

export interface Permission {
  name: string;
}

export async function getRoles(
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  sortBy: string = 'id',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<PaginatedData<Role>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (search) params.append('search', search);
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);

  return apiRequest<PaginatedData<Role>>(`/api/administrator/roles?${params.toString()}`);
}

export async function getRole(id: number): Promise<ApiResponse<Role>> {
  return apiRequest<Role>(`/api/administrator/roles/${id}`);
}

export async function createRole(data: RoleCreateData): Promise<ApiResponse<Role>> {
  return apiRequest<Role>('/api/administrator/roles', {
    method: 'POST',
    data,
  });
}

export async function updateRole(id: number, data: Partial<RoleCreateData>): Promise<ApiResponse<Role>> {
  return apiRequest<Role>(`/api/administrator/roles/${id}`, {
    method: 'PATCH',
    data,
  });
}

export async function deleteRole(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/administrator/roles/${id}`, {
    method: 'DELETE',
  });
}

export async function getPermissions(): Promise<ApiResponse<Permission[]>> {
  return apiRequest<Permission[]>('/api/administrator/roles/permissions');
}
