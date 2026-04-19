'use client';

import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, Search, ScanLine } from 'lucide-react';
import BarcodeScanner from '../_components/BarcodeScanner';
import { useToast } from '@/components/toast/ToastContainer';

interface BranchOption {
  uuid: string;
  code: string;
  name: string;
  is_main: boolean;
  is_active: boolean;
}

interface ProductBranchPrice {
  branch_uuid: string;
  branch_name?: string | null;
  branch_code?: string | null;
  selling_price: number;
  wholesale_price: number;
}

interface ProductStock {
  branch_uuid: string;
  branch_name?: string;
  stock: number;
}

interface ProductSummary {
  uuid: string;
  name: string;
  sku: string;
  barcode?: string | null;
  unit: string;
  image?: string | null;
  is_active: boolean;
  selling_price: number;
  wholesale_price: number;
  total_stock: number;
  branch_prices?: ProductBranchPrice[];
}

interface ProductDetail extends ProductSummary {
  purchase_price?: number;
  min_stock: number;
  category?: {
    uuid: string;
    name: string;
  };
  stocks?: ProductStock[];
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getEffectivePrice(product: ProductSummary | ProductDetail | null, branchUuid: string) {
  if (!product) return { selling: 0, wholesale: 0 };
  const branchPrice = branchUuid
    ? product.branch_prices?.find((item) => item.branch_uuid === branchUuid)
    : null;
  return {
    selling: branchPrice ? Number(branchPrice.selling_price) : Number(product.selling_price || 0),
    wholesale: branchPrice ? Number(branchPrice.wholesale_price) : Number(product.wholesale_price || 0),
  };
}

export default function PriceCheckPage() {
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isBarcodeLookup, setIsBarcodeLookup] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchUuid, setSelectedBranchUuid] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedProductUuid, setSelectedProductUuid] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadProductDetail = useCallback(
    async (uuid: string) => {
      if (!uuid) return;
      setIsDetailLoading(true);
      try {
        const response = await fetch(`/api/admin/pos/price-check/${uuid}`);
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          setSelectedProduct(result.data);
          setSelectedProductUuid(result.data.uuid);
        } else {
          throw new Error(result.message || 'Gagal memuat detail produk');
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Gagal memuat detail produk';
        toast.error(message);
      } finally {
        setIsDetailLoading(false);
      }
    },
    [toast]
  );

  const loadOptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/pos/price-check/options');
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const branchList: BranchOption[] = result.data.branches || [];
        setBranches(branchList);
        if (branchList.length > 0) {
          const mainBranch = branchList.find((item) => item.is_main) || branchList[0];
          setSelectedBranchUuid((prev) => prev || mainBranch.uuid);
        }
      }
    } catch {
      toast.error('Gagal memuat opsi cek harga');
    }
  }, [toast]);

  const loadProducts = useCallback(
    async (query: string, branchUuid: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          per_page: '20',
          search: query,
          sort_by: 'name',
          sort_order: 'asc',
        });
        if (branchUuid) params.append('branch_uuid', branchUuid);

        const response = await fetch(`/api/admin/pos/price-check?${params.toString()}`);
        const result = await response.json();

        const rows: ProductSummary[] = result.status === 'success' ? result.data?.data || [] : [];
        setProducts(rows);

        if (rows.length === 0) {
          setSelectedProductUuid('');
          setSelectedProduct(null);
          return;
        }

        const keepSelected = rows.some((item) => item.uuid === selectedProductUuid);
        if (!keepSelected) {
          await loadProductDetail(rows[0].uuid);
        }
      } catch {
        setProducts([]);
        setSelectedProductUuid('');
        setSelectedProduct(null);
        toast.error('Gagal memuat produk untuk cek harga');
      } finally {
        setIsLoading(false);
      }
    },
    [loadProductDetail, selectedProductUuid, toast]
  );

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadProducts(debouncedSearch, selectedBranchUuid);
  }, [debouncedSearch, selectedBranchUuid, loadProducts]);

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await loadProducts(searchQuery.trim(), selectedBranchUuid);
  };

  const handleBarcodeScan = useCallback(
    async (code: string) => {
      if (isBarcodeLookup) return;
      const trimmed = code.trim();
      if (!trimmed) return;

      setIsBarcodeLookup(true);
      setShowScanner(false);
      setSearchQuery(trimmed);

      try {
        const params = new URLSearchParams({ barcode: trimmed });
        if (selectedBranchUuid) params.append('branch_uuid', selectedBranchUuid);

        const response = await fetch(`/api/admin/pos/products/lookup-barcode?${params.toString()}`);
        const result = await response.json();

        if (result.status !== 'success' || !result.data?.uuid) {
          throw new Error(result.message || `Produk dengan kode ${trimmed} tidak ditemukan`);
        }

        await loadProducts(trimmed, selectedBranchUuid);
        await loadProductDetail(result.data.uuid);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Produk tidak ditemukan';
        toast.error(message);
      } finally {
        setIsBarcodeLookup(false);
      }
    },
    [isBarcodeLookup, loadProductDetail, loadProducts, selectedBranchUuid, toast]
  );

  const selectedBranchName = useMemo(() => {
    if (!selectedBranchUuid) return 'Semua cabang';
    return branches.find((item) => item.uuid === selectedBranchUuid)?.name || 'Cabang';
  }, [branches, selectedBranchUuid]);

  const effectivePrice = useMemo(
    () => getEffectivePrice(selectedProduct, selectedBranchUuid),
    [selectedProduct, selectedBranchUuid]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52] flex items-center gap-2">
          <ScanLine className="w-6 h-6" />
          Cek Harga
        </h1>
        <p className="text-gray-600 mt-1">Cari produk, scan barcode, dan lihat harga serta stok per cabang.</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
            <select
              value={selectedBranchUuid}
              onChange={(e) => setSelectedBranchUuid(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Cabang</option>
              {branches.map((branch) => (
                <option key={branch.uuid} value={branch.uuid}>
                  {branch.code} - {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-7">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Produk</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama produk, SKU, atau barcode..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              />
            </div>
          </div>

          <div className="lg:col-span-2 flex gap-2 items-end">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="cursor-pointer px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              title="Scan barcode dengan kamera"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="cursor-pointer w-full px-4 py-2 rounded-lg bg-[#EBC170] hover:bg-[#d4ab5f] text-gray-900 font-semibold"
            >
              Cari
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-white border border-gray-200 rounded-xl">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-[#142D52]">Hasil Pencarian</h2>
            <span className="text-xs text-gray-500">{products.length} produk</span>
          </div>

          <div className="max-h-[560px] overflow-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500">Memuat produk...</div>
            ) : products.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Produk tidak ditemukan.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {products.map((product) => {
                  const pricing = getEffectivePrice(product, selectedBranchUuid);
                  const active = selectedProductUuid === product.uuid;
                  return (
                    <button
                      key={product.uuid}
                      type="button"
                      onClick={() => loadProductDetail(product.uuid)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        active ? 'bg-[#FFF8EC]' : ''
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</p>
                      {product.barcode ? <p className="text-xs text-gray-500">Barcode: {product.barcode}</p> : null}
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#142D52]">{formatCurrency(pricing.selling)}</p>
                        <p className="text-xs text-gray-600">
                          Stok {selectedBranchUuid ? selectedBranchName : 'Total'}: {product.total_stock}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-8 bg-white border border-gray-200 rounded-xl p-4">
          {selectedProduct ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-44">
                  <div className="relative w-full h-44 bg-gray-100 rounded-lg overflow-hidden">
                    {selectedProduct.image ? (
                      <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">No image</div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#142D52]">{selectedProduct.name}</h2>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-700">SKU: <span className="font-medium">{selectedProduct.sku}</span></p>
                    <p className="text-gray-700">
                      Barcode: <span className="font-medium">{selectedProduct.barcode || '-'}</span>
                    </p>
                    <p className="text-gray-700">Kategori: <span className="font-medium">{selectedProduct.category?.name || '-'}</span></p>
                    <p className="text-gray-700">Satuan: <span className="font-medium">{selectedProduct.unit || '-'}</span></p>
                    <p className="text-gray-700">
                      Status: <span className={`font-medium ${selectedProduct.is_active ? 'text-green-600' : 'text-red-600'}`}>{selectedProduct.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </p>
                    <p className="text-gray-700">Min. Stok: <span className="font-medium">{selectedProduct.min_stock}</span></p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <p className="text-xs text-gray-500">Harga Jual {selectedBranchUuid ? `(${selectedBranchName})` : ''}</p>
                  <p className="text-lg font-semibold text-[#142D52]">{formatCurrency(effectivePrice.selling)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <p className="text-xs text-gray-500">Harga Grosir {selectedBranchUuid ? `(${selectedBranchName})` : ''}</p>
                  <p className="text-lg font-semibold text-[#142D52]">{formatCurrency(effectivePrice.wholesale)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <p className="text-xs text-gray-500">Harga Modal (Internal)</p>
                  <p className="text-lg font-semibold text-[#142D52]">{formatCurrency(selectedProduct.purchase_price)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-[#142D52]">Harga Per Cabang</p>
                  </div>
                  <div className="max-h-60 overflow-auto">
                    {selectedProduct.branch_prices && selectedProduct.branch_prices.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Cabang</th>
                            <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Jual</th>
                            <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Grosir</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProduct.branch_prices.map((item, idx) => (
                            <tr key={`${item.branch_uuid}-${idx}`} className="border-t border-gray-100">
                              <td className="px-3 py-2">{item.branch_name || item.branch_code || item.branch_uuid}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(item.selling_price)}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(item.wholesale_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="px-3 py-3 text-sm text-gray-500">Belum ada override harga per cabang.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-[#142D52]">Stok Per Cabang</p>
                  </div>
                  <div className="max-h-60 overflow-auto">
                    {selectedProduct.stocks && selectedProduct.stocks.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Cabang</th>
                            <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Stok</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProduct.stocks.map((item, idx) => (
                            <tr key={`${item.branch_uuid}-${idx}`} className="border-t border-gray-100">
                              <td className="px-3 py-2">{item.branch_name || item.branch_uuid}</td>
                              <td className="px-3 py-2 text-right font-medium">{item.stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="px-3 py-3 text-sm text-gray-500">Belum ada data stok cabang.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[420px] flex items-center justify-center text-sm text-gray-500">
              {isDetailLoading ? 'Memuat detail produk...' : 'Pilih produk dari panel kiri untuk melihat detail harga.'}
            </div>
          )}
        </div>
      </div>

      <BarcodeScanner isOpen={showScanner} onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
    </div>
  );
}
