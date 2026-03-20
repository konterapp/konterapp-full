'use client';

import { Search } from 'lucide-react';
import { PpobProductLocal } from '@/lib/api/admin/ppob';

interface ProductGridProps {
  products: PpobProductLocal[];
  selectedProduct: PpobProductLocal | null;
  onSelect: (product: PpobProductLocal) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
}

export default function ProductGrid({ products, selectedProduct, onSelect, searchQuery, onSearchChange, isLoading }: ProductGridProps) {
  const filtered = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.product_name.toLowerCase().includes(q) ||
      p.provider_product_code.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari produk..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142D52]/20 focus:border-[#142D52]"
        />
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#142D52]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {searchQuery ? 'Produk tidak ditemukan' : 'Pilih kategori untuk melihat produk'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {filtered.map((product) => (
            <button
              key={product.uuid}
              onClick={() => onSelect(product)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                selectedProduct?.uuid === product.uuid
                  ? 'border-[#142D52] bg-[#142D52]/5 ring-1 ring-[#142D52]'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{product.product_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {product.brand && <span className="font-medium text-gray-600">{product.brand}</span>}
                    {product.brand && ' · '}
                    {product.provider_product_code}
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  product.provider === 'rajabiller'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {product.provider === 'rajabiller' ? 'RB' : 'DF'}
                </span>
              </div>
              <div className="text-sm font-semibold text-[#142D52] mt-1">{formatPrice(Number(product.selling_price))}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
