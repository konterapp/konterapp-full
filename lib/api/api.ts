import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: '',
  headers: {
    'Accept': 'application/json',
  },
});

export interface PaginatedData<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export async function apiRequest<T>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const headers = config?.data instanceof FormData
      ? config.headers
      : { 'Content-Type': 'application/json', ...config?.headers };

    const response = await axiosInstance.request<ApiResponse<T>>({
      url: endpoint,
      ...config,
      headers,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;

      if (axiosError.response) {
        if (axiosError.response.status === 401) {
          // Jangan redirect kalau sedang di halaman login (endpoint auth)
          const isAuthEndpoint = config?.url?.startsWith('/api/auth/') || endpoint.startsWith('/api/auth/');
          if (!isAuthEndpoint && typeof window !== 'undefined') {
            const nextLocale = document.cookie
              .split('; ')
              .find(row => row.startsWith('NEXT_LOCALE='))
              ?.split('=')[1];
            const loginPath = nextLocale && nextLocale !== 'id' ? `/${nextLocale}/login` : '/login';
            window.location.href = loginPath;
            return {
              status: 'error',
              message: 'Sesi Anda telah berakhir. Silakan login kembali.',
            };
          }

          return {
            status: 'error',
            message: axiosError.response.data?.message || 'Email atau password salah',
            errors: axiosError.response.data?.errors,
          };
        }

        if (axiosError.response.status === 429) {
          return {
            status: 'error',
            message: 'Terlalu banyak percobaan. Silakan tunggu beberapa saat sebelum mencoba lagi.',
          };
        }

        return {
          status: 'error',
          message: axiosError.response.data?.message || 'Terjadi kesalahan',
          errors: axiosError.response.data?.errors,
          data: axiosError.response.data?.data as T | undefined,
        };
      }
    }

    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Terjadi kesalahan pada koneksi',
    };
  }
}
