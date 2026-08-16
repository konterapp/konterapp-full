export interface ProductImageData {
  uuid: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  uuid: string;
  name: string;
  sku: string;
  purchase_price?: number;
  selling_price: number;
  wholesale_price?: number;
  min_stock: number;
  unit: string;
  barcode?: string;
  additional_barcodes?: string[];
  unit_conversions?: {
    uuid?: string;
    unit: string;
    factor_to_base: number;
    is_active: boolean;
  }[];
  branch_prices?: {
    uuid?: string;
    branch_uuid: string;
    branch_name?: string | null;
    branch_code?: string | null;
    selling_price: number;
    wholesale_price: number;
  }[];
  image?: string | null;
  images?: ProductImageData[];
  is_active: boolean;
  category_uuid: string;
  category?: {
    uuid: string;
    name: string;
  };
  stocks?: {
    branch_uuid: string;
    stock: number;
  }[];
  total_stock?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  status: string;
  message: string;
  data: {
    data: Product[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  };
}

export async function getProducts(
  page = 1,
  perPage = 10,
  search = '',
  sortBy = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  branch_uuid?: string,
  category_uuid?: string,
  in_stock?: boolean
): Promise<ProductsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    search,
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  if (branch_uuid) params.append('branch_uuid', branch_uuid);
  if (category_uuid) params.append('category_uuid', category_uuid);
  if (in_stock) params.append('in_stock', 'true');

  const response = await fetch(`/api/app/pos/products?${params}`);
  return response.json();
}

export async function getProduct(uuid: string): Promise<{ status: string; data: Product }> {
  const response = await fetch(`/api/app/pos/products/${uuid}`);
  return response.json();
}

export async function lookupBarcode(barcode: string, branch_uuid?: string): Promise<{ status: string; data: Product }> {
  const params = new URLSearchParams({ barcode, ...(branch_uuid && { branch_uuid }) });
  const response = await fetch(`/api/app/pos/products/lookup-barcode?${params}`);
  return response.json();
}

export async function createProduct(data: {
  category_uuid: string;
  name: string;
  sku: string;
  purchase_price?: number;
  selling_price: number;
  wholesale_price?: number;
  min_stock?: number;
  unit?: string;
  barcode?: string;
  additional_barcodes?: string[];
  unit_conversions?: {
    unit: string;
    factor_to_base: number;
    is_active?: boolean;
  }[];
  branch_prices?: {
    branch_uuid: string;
    selling_price: number;
    wholesale_price: number;
  }[];
  image?: string;
  initial_stock?: number;
  branch_uuid?: string;
}): Promise<{ status: string; data: Product }> {
  const response = await fetch('/api/app/pos/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateProduct(
  uuid: string,
  data: {
    category_uuid?: string;
    name?: string;
    sku?: string;
    purchase_price?: number;
    selling_price?: number;
    wholesale_price?: number;
    min_stock?: number;
    unit?: string;
    barcode?: string;
    additional_barcodes?: string[];
    unit_conversions?: {
      unit: string;
      factor_to_base: number;
      is_active?: boolean;
    }[];
    branch_prices?: {
      branch_uuid: string;
      selling_price: number;
      wholesale_price: number;
    }[];
    image?: string;
    is_active?: boolean;
  }
): Promise<{ status: string; data: Product }> {
  const response = await fetch(`/api/app/pos/products/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteProduct(uuid: string): Promise<{ status: string }> {
  const response = await fetch(`/api/app/pos/products/${uuid}`, {
    method: 'DELETE',
  });
  return response.json();
}
