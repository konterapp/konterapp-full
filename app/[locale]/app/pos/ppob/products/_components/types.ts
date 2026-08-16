export interface PpobProductLocal {
  uuid: string;
  provider: string;
  provider_label: string;
  provider_product_code: string;
  product_name: string;
  brand: string | null;
  category: string;
  type: string;
  seller_name: string | null;
  base_price: number;
  admin_fee: number;
  selling_price: number;
  digiflazz_type: string | null;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string | null;
  end_cut_off: string | null;
  desc: string | null;
  is_active: boolean;
  provider_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
