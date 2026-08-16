import { apiRequest, ApiResponse, PaginatedData } from '../api';

export interface User {
  id: number;
  uuid: string;
  name: string;
  email: string;
  source?: string;
  is_active?: boolean;
  roles?: string[];
  permissions?: string[];
  companies?: { uuid: string; code: string; name: string; is_default: boolean }[];
  phone?: string;
  phone_without_dc?: string;
  dc?: string;
  iso?: string;
  title?: string;
  company?: string;
  work_unit?: string;
  admin_scope?: string;
  wilayah_kode?: string;
  province?: string;
  city?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  company_uuid?: string;
  roles: number | '';
  phone?: string;
  phone_without_dc?: string;
  dc?: string;
  iso?: string;
  title?: string;
  company?: string;
  work_unit?: string;
  admin_scope?: string;
  wilayah_kode?: string;
  profile_photo?: File;
  profile_photo_formated?: boolean;
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
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
      } else {
        formData.append(key, String(value));
      }
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
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');
      } else {
        formData.append(key, String(value));
      }
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

export async function getRoles(): Promise<ApiResponse<Role[]>> {
  return apiRequest<Role[]>('/api/administrator/users/roles');
}

export async function toggleUserActive(uuid: string): Promise<ApiResponse<User>> {
  return apiRequest<User>(`/api/administrator/users/${uuid}/toggle-active`, {
    method: 'PATCH',
  });
}
