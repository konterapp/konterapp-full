import { apiRequest, ApiResponse, PaginatedData } from '../api';

export interface Berita {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  content: string;
  image?: string;
  image_url?: string;
  tags: string[];
  news_type?: string;
  category?: string;
  author?: string;
  published_at: string;
  is_published: boolean;
  is_draft: boolean;
  views: number;
  created_at?: string;
  updated_at?: string;
}

export interface BeritaCreateData {
  title: string;
  content: string;
  image?: File;
  tags: string[];
  news_type?: string;
  category?: string;
  published_at: string;
  is_published: boolean;
}

export async function getBeritas(
  page: number = 1,
  perPage: number = 10,
  search: string = '',
  sortBy: string = 'id',
  sortOrder: 'asc' | 'desc' = 'desc',
  isPublished?: string
): Promise<ApiResponse<PaginatedData<Berita>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (search) params.append('search', search);
  if (sortBy) params.append('sort_by', sortBy);
  if (sortOrder) params.append('sort_order', sortOrder);
  if (isPublished) params.append('is_published', isPublished);

  return apiRequest<PaginatedData<Berita>>(`/api/admin/berita?${params.toString()}`);
}

export async function getBerita(uuid: string): Promise<ApiResponse<Berita>> {
  return apiRequest<Berita>(`/api/admin/berita/${uuid}`);
}

export async function createBerita(data: BeritaCreateData): Promise<ApiResponse<Berita>> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('content', data.content);
  formData.append('published_at', data.published_at);
  formData.append('is_published', data.is_published ? '1' : '0');
  if (data.image) formData.append('image', data.image);
  if (data.news_type) formData.append('news_type', data.news_type);
  if (data.category) formData.append('category', data.category);
  if (data.tags.length > 0) formData.append('tags', JSON.stringify(data.tags));

  return apiRequest<Berita>('/api/admin/berita', {
    method: 'POST',
    data: formData,
  });
}

export async function updateBerita(uuid: string, data: Partial<BeritaCreateData>): Promise<ApiResponse<Berita>> {
  const formData = new FormData();
  if (data.title !== undefined) formData.append('title', data.title);
  if (data.content !== undefined) formData.append('content', data.content);
  if (data.published_at !== undefined) formData.append('published_at', data.published_at);
  if (data.is_published !== undefined) formData.append('is_published', data.is_published ? '1' : '0');
  if (data.image) formData.append('image', data.image);
  if (data.news_type !== undefined) formData.append('news_type', data.news_type || '');
  if (data.category !== undefined) formData.append('category', data.category || '');
  if (data.tags !== undefined) formData.append('tags', JSON.stringify(data.tags));

  return apiRequest<Berita>(`/api/admin/berita/${uuid}`, {
    method: 'PATCH',
    data: formData,
  });
}

export async function deleteBerita(uuid: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/admin/berita/${uuid}`, {
    method: 'DELETE',
  });
}
