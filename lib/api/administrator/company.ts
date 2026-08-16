import { apiRequest, ApiResponse } from '../api';

export interface CompanyOption {
  uuid: string;
  code: string;
  name: string;
}

export async function getCompanies(): Promise<ApiResponse<CompanyOption[]>> {
  return apiRequest<CompanyOption[]>('/api/administrator/companies', {
    method: 'GET',
  });
}
