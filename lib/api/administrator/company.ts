import { apiRequest, ApiResponse, PaginatedData } from '../api';

export interface Company {
  uuid: string;
  code: string;
  name: string;
  is_active: boolean;
  users_count?: number;
  branches_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyCreateData {
  code: string;
  name: string;
  is_active?: boolean;
}

export interface CompanyOption {
  uuid: string;
  code: string;
  name: string;
}

export async function getCompaniesList(
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse<PaginatedData<Company>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (search) params.append('search', search);
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);

  return apiRequest<PaginatedData<Company>>(`/api/administrator/companies?${params.toString()}`);
}

export async function getCompany(uuid: string): Promise<ApiResponse<Company>> {
  return apiRequest<Company>(`/api/administrator/companies/${uuid}`);
}

export async function createCompany(data: CompanyCreateData): Promise<ApiResponse<Company>> {
  return apiRequest<Company>('/api/administrator/companies', {
    method: 'POST',
    data,
  });
}

export async function updateCompany(uuid: string, data: CompanyCreateData): Promise<ApiResponse<Company>> {
  return apiRequest<Company>(`/api/administrator/companies/${uuid}`, {
    method: 'PATCH',
    data,
  });
}

export async function toggleCompanyActive(uuid: string): Promise<ApiResponse<Company>> {
  return apiRequest<Company>(`/api/administrator/companies/${uuid}/toggle-active`, {
    method: 'PATCH',
  });
}

export async function getCompanyOptions(): Promise<ApiResponse<CompanyOption[]>> {
  return apiRequest<CompanyOption[]>('/api/administrator/companies/options');
}
