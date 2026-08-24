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
          const requestUrl = config?.url || endpoint;
          const isAdministratorEndpoint = requestUrl.startsWith('/api/administrator/');
          // Endpoint yang TIDAK boleh auto-redirect saat 401:
          // - endpoint submit form login (401 = "email/password salah",
          //   ditampilkan inline di form, bukan sesi invalid)
          // - /api/auth/user: dipanggil juga dari Header di halaman publik
          //   (landing, login, register) cuma buat cek "lagi login atau
          //   tidak" -- 401 di situ wajar (memang belum login), BUKAN sinyal
          //   sesi invalid. Redirect utk kasus sesi invalid di dalam /app
          //   (mis. akun dihapus tapi cookie sesi masih ada) ditangani sendiri
          //   oleh UserContext, bukan di sini, karena endpoint ini dipakai
          //   lintas konteks publik & terproteksi.
          const isExcludedFromRedirect =
            requestUrl.startsWith('/api/auth/login') ||
            requestUrl.startsWith('/api/administrator/auth/login') ||
            requestUrl.startsWith('/api/auth/user');
          if (!isExcludedFromRedirect && typeof window !== 'undefined') {
            const nextLocale = document.cookie
              .split('; ')
              .find(row => row.startsWith('NEXT_LOCALE='))
              ?.split('=')[1];
            const basePath = isAdministratorEndpoint ? '/administrator/login' : '/login';
            const loginPath = nextLocale && nextLocale !== 'id' ? `/${nextLocale}${basePath}` : basePath;
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
