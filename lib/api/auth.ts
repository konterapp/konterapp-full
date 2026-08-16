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
  avatar?: string;
  avatar_url?: string;
  impersonating?: boolean;
  profile?: UserProfile;
}

export interface UserCompany {
  uuid: string;
  code: string;
  name: string;
  is_default?: boolean;
}

export interface UserSubscription {
  plan: { uuid: string; code: string; name: string; price: number; duration_days: number };
  status: string;
  started_at: string;
  expires_at: string;
}

export interface UserProfile {
  phone_without_dc?: string;
  dc?: string;
  iso?: string;
  address?: string;
  avatar?: string;
  title?: string;
  company?: string;
  work_unit?: string;
  description?: string;
  company_logo?: string;
  country_id?: number;
  wilayah_kode?: string;
  province_id?: number;
  city_id?: number;
  admin_scope?: 'daerah' | 'nasional' | 'internasional' | 'mice' | null;
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
