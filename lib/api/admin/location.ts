import { apiRequest, ApiResponse } from '../api';

export interface LocationOption {
  id: number;
  name: string;
}

export interface CountryOption {
  id: number;
  country_name: string;
}

export async function getCountries(): Promise<ApiResponse<CountryOption[]>> {
  return apiRequest<CountryOption[]>('/api/admin/locations/countries', {
    method: 'GET',
  });
}

export async function getProvinces(countryId?: number): Promise<ApiResponse<LocationOption[]>> {
  const params = countryId ? `?country_id=${countryId}` : '';
  return apiRequest<LocationOption[]>(`/api/admin/locations/provinces${params}`, {
    method: 'GET',
  });
}

export async function getCities(provinceId?: number): Promise<ApiResponse<LocationOption[]>> {
  const params = provinceId ? `?province_id=${provinceId}` : '';
  return apiRequest<LocationOption[]>(`/api/admin/locations/cities${params}`, {
    method: 'GET',
  });
}

export async function getSubdistricts(cityId?: number): Promise<ApiResponse<LocationOption[]>> {
  const params = cityId ? `?subdistrict_id=${cityId}` : '';
  return apiRequest<LocationOption[]>(`/api/admin/locations/subdistricts${params}`, {
    method: 'GET',
  });
}

export async function getVillages(subdistrictId?: number): Promise<ApiResponse<LocationOption[]>> {
  const params = subdistrictId ? `?subdistrict_id=${subdistrictId}` : '';
  return apiRequest<LocationOption[]>(`/api/admin/locations/villages${params}`, {
    method: 'GET',
  });
}

// Wilayah (Kepmendagri 2025)
export interface WilayahOption {
  kode: string;
  nama: string;
}

export interface WilayahHierarchy {
  province?: { kode: string; nama: string };
  city?: { kode: string; nama: string };
  subdistrict?: { kode: string; nama: string };
  village?: { kode: string; nama: string };
}

export async function getWilayah(parentKode?: string): Promise<ApiResponse<WilayahOption[]>> {
  const params = parentKode ? `?parent_kode=${parentKode}` : '';
  return apiRequest<WilayahOption[]>(`/api/admin/locations/wilayah${params}`, {
    method: 'GET',
  });
}

export async function getWilayahDetail(kode: string): Promise<ApiResponse<WilayahHierarchy>> {
  return apiRequest<WilayahHierarchy>(`/api/admin/locations/wilayah/${kode}`, {
    method: 'GET',
  });
}
