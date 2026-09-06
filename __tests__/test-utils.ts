import { NextRequest } from 'next/server';

/**
 * Creates a mock NextRequest with dynamic URL
 * @param path - API path (e.g., '/api/app/users')
 * @param options - Request options (method, body, etc.)
 */
export function createMockRequest(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    searchParams?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, searchParams = {}, headers = {} } = options;

  // Build URL with search params
  const url = new URL(path, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Build request options
  // Pakai tipe parameter konstruktor NextRequest, bukan RequestInit milik DOM
  // -- Next punya definisi RequestInit sendiri yang tidak identik.
  const reqOptions: NonNullable<ConstructorParameters<typeof NextRequest>[1]> = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    reqOptions.body = JSON.stringify(body);
  }

  return new NextRequest(url.toString(), reqOptions);
}

/**
 * Creates a mock context for route handlers
 */
export function createMockContext(overrides: Record<string, any> = {}) {
  // `params` wajib ada: wrapper route (withAuth dkk) mengetiknya sebagai
  // Promise, meski handler tanpa dynamic segment tidak memakainya.
  return {
    params: Promise.resolve({} as Record<string, string>),
    userId: 1,
    ...overrides,
  };
}

/**
 * Extracts JSON from response with type safety
 */
export async function getResponseJson<T = any>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Common success response structure
 */
export interface SuccessResponse<T = any> {
  status: 'success';
  message: string;
  data?: T;
}

/**
 * Common paginated response structure
 */
export interface PaginatedResponse<T = any> {
  status: 'success';
  message: string;
  data: {
    data: T[];
    meta?: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
    pagination?: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  };
}
