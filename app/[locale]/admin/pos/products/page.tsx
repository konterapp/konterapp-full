'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface Product {
  uuid: string;
  name: string;
  sku: string;
  selling_price: number;
  stock: number;
  category_name?: string;
  image?: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // TODO: Implement API call to fetch products
    // For now, using mock data
    setProducts([
      {
        uuid: '1',
        name: 'Pulsa Telkomsel 10.000',
        sku: 'TKL10',
        selling_price: 11000,
        stock: 100,
        category_name: 'Pulsa',
      },
      {
        uuid: '2',
        name: 'Token PLN 20.000',
        sku: 'PLN20',
        selling_price: 21000,
        stock: 50,
        category_name: 'Token PLN',
      },
    ]);
    setIsLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">Produk</h1>
          <p className="text-gray-600 mt-1">Kelola data produk dan stok</p>
        </div>
        <Link
          href="/admin/pos/products/create"
          className="flex items-center gap-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Produk</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk (nama, SKU, barcode)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Produk</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">SKU</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Kategori</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Harga Jual</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Stok</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#142D52]"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.uuid} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 font-mono">{product.sku}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{product.category_name || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.selling_price)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock <= 10
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/pos/products/${product.uuid}/edit`}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Belum ada produk</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
