import { apiRequest, ApiResponse } from '../api';

export interface Administrator {
  id: number;
  uuid: string;
  name: string;
  email: string;
}

export async function loginAdministrator(email: string, password: string): Promise<ApiResponse<{ administrator: Administrator }>> {
  return apiRequest<{ administrator: Administrator }>('/api/administrator/auth/login', {
    method: 'POST',
    data: { email, password },
  });
}

export async function logoutAdministrator(): Promise<ApiResponse<void>> {
  return apiRequest<void>('/api/administrator/auth/logout', {
    method: 'POST',
  });
}

export async function getAdministrator(): Promise<ApiResponse<{ administrator: Administrator }>> {
  return apiRequest<{ administrator: Administrator }>('/api/administrator/auth/me', {
    method: 'GET',
  });
}
