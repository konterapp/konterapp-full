import { apiRequest, ApiResponse } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  active_company_uuid?: string;
  companies?: UserCompany[];
  subscription?: UserSubscription | null;
  impersonating?: boolean;
  impersonated_by_administrator?: boolean;
}

export interface UserCompany {
  uuid: string;
  code: string;
  name: string;
  allow_negative_stock?: boolean;
  is_default?: boolean;
}

export interface UserSubscription {
  plan: { uuid: string; code: string; name: string; price: number; duration_days: number };
  status: string;
  started_at: string;
  expires_at: string;
}

export async function login(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
  return apiRequest<{ user: User }>('/api/auth/login', {
    method: 'POST',
    data: { email, password },
  });
}

export async function logout(): Promise<ApiResponse<void>> {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function getUser(): Promise<ApiResponse<User>> {
  return apiRequest<User>('/api/auth/user', {
    method: 'GET',
  });
}

export async function resendVerification(email: string): Promise<ApiResponse<null>> {
  return apiRequest<null>('/api/auth/resend-verification', {
    method: 'POST',
    data: { email },
  });
}

export async function switchActiveCompany(companyUuid: string): Promise<ApiResponse<{ active_company_uuid: string; companies: UserCompany[] }>> {
  return apiRequest<{ active_company_uuid: string; companies: UserCompany[] }>('/api/auth/company/switch', {
    method: 'POST',
    data: { company_uuid: companyUuid },
  });
}
