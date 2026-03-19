'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  BarChart3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface ProfitLossProduct {
  product_uuid: string;
  product_name: string;
  sku: string;
  qty_sold: number;
  avg_purchase_price: number;
  avg_selling_price: number;
  total_revenue: number;
  total_cogs: number;
  profit: number;
  margin_percentage: number;
}

interface ProfitLossReport {
  period: { from: string; to: string };
  branch: { uuid: string; name: string } | null;
  summary: {
    total_revenue: number;
    total_transactions: number;
    total_cogs: number;
    total_items_sold: number;
    total_profit: number;
    margin_percentage: number;
  };
  products: ProfitLossProduct[];
}

type SortField = 'product_name' | 'qty_sold' | 'total_revenue' | 'total_cogs' | 'profit' | 'margin_percentage';
type SortOrder = 'asc' | 'desc';

type BranchOption = {
  uuid: string;
  name: string;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

export default function ReportsPage() {
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-01';
  });
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date();
    return now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
  });
  const [branchUuid, setBranchUuid] = useState('');
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const [sortField, setSortField] = useState<SortField>('profit');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [dateFrom, dateTo, branchUuid]);

  const loadBranches = async () => {
    try {
      const response = await fetch('/api/admin/pos/branches/list');
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        const items = result.data.data || result.data || [];
        const options = [
          { uuid: '', name: 'Semua Cabang' },
          ...items.map((branch: any) => ({ uuid: branch.uuid, name: branch.name })),
        ];
        setBranches(options);
      }
    } catch {
      setBranches([{ uuid: '', name: 'Semua Cabang' }]);
    }
  };

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (branchUuid) params.append('branch_uuid', branchUuid);

      const query = params.toString();
      const response = await fetch('/api/admin/pos/reports/profit-loss' + (query ? '?' + query : ''));
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setReport(result.data);
      } else {
        setError(result.message || 'Gagal memuat laporan');
        setReport(null);
      }
    } catch {
      setError('Terjadi kesalahan saat memuat laporan');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortedProducts = (): ProfitLossProduct[] => {
    if (!report?.products) return [];
    return [...report.products].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">Laporan Laba/Rugi</h1>
          <p className="text-gray-600 mt-1">Analisis keuntungan berdasarkan penjualan dan harga beli</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
            <select
              value={branchUuid}
              onChange={(e) => setBranchUuid(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] cursor-pointer"
            >
              {branches.map((branch) => (
                <option key={branch.uuid || 'all'} value={branch.uuid}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBC170]"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && !error && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Pendapatan</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(report.summary.total_revenue)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{report.summary.total_transactions} transaksi</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Modal (HPP)</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(report.summary.total_cogs)}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-full">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{report.summary.total_items_sold} item terjual</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Laba Kotor</p>
                  <p className={
                    'text-xl font-bold mt-1 ' +
                    (report.summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600')
                  }>
                    {formatCurrency(report.summary.total_profit)}
                  </p>
                </div>
                <div className={
                  'p-3 rounded-full ' +
                  (report.summary.total_profit >= 0 ? 'bg-green-50' : 'bg-red-50')
                }>
                  {report.summary.total_profit >= 0
                    ? <TrendingUp className="w-5 h-5 text-green-600" />
                    : <TrendingDown className="w-5 h-5 text-red-600" />
                  }
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Pendapatan - Modal</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Margin</p>
                  <p className={
                    'text-xl font-bold mt-1 ' +
                    (report.summary.margin_percentage >= 0 ? 'text-green-600' : 'text-red-600')
                  }>
                    {report.summary.margin_percentage}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Persentase keuntungan</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700">Detail Per Produk</h2>
                <span className="text-xs text-gray-400">({report.products.length} produk)</span>
              </div>
            </div>

            {report.products.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Tidak ada data penjualan pada periode ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th className="px-4 py-3 text-left font-medium">No</th>
                      <th className="px-4 py-3 text-left font-medium">
                        <button onClick={() => handleSort('product_name')} className="flex items-center cursor-pointer hover:text-gray-700">
                          Produk <SortIcon field="product_name" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        <button onClick={() => handleSort('qty_sold')} className="flex items-center justify-end cursor-pointer hover:text-gray-700 ml-auto">
                          Qty <SortIcon field="qty_sold" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Rata-rata Beli</th>
                      <th className="px-4 py-3 text-right font-medium">Rata-rata Jual</th>
                      <th className="px-4 py-3 text-right font-medium">
                        <button onClick={() => handleSort('total_revenue')} className="flex items-center justify-end cursor-pointer hover:text-gray-700 ml-auto">
                          Pendapatan <SortIcon field="total_revenue" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        <button onClick={() => handleSort('total_cogs')} className="flex items-center justify-end cursor-pointer hover:text-gray-700 ml-auto">
                          Modal <SortIcon field="total_cogs" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        <button onClick={() => handleSort('profit')} className="flex items-center justify-end cursor-pointer hover:text-gray-700 ml-auto">
                          Laba <SortIcon field="profit" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        <button onClick={() => handleSort('margin_percentage')} className="flex items-center justify-end cursor-pointer hover:text-gray-700 ml-auto">
                          Margin <SortIcon field="margin_percentage" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getSortedProducts().map((product, index) => (
                      <tr key={product.product_uuid} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-xs text-gray-400">{product.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{product.qty_sold}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(product.avg_purchase_price)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(product.avg_selling_price)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(product.total_revenue)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(product.total_cogs)}</td>
                        <td className={
                          'px-4 py-3 text-sm text-right font-medium ' +
                          (product.profit >= 0 ? 'text-green-600' : 'text-red-600')
                        }>
                          {formatCurrency(product.profit)}
                        </td>
                        <td className={
                          'px-4 py-3 text-sm text-right font-medium ' +
                          (product.margin_percentage >= 0 ? 'text-green-600' : 'text-red-600')
                        }>
                          {product.margin_percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-3 text-sm" colSpan={2}>Total</td>
                      <td className="px-4 py-3 text-sm text-right">{report.summary.total_items_sold}</td>
                      <td className="px-4 py-3" colSpan={2}></td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(report.summary.total_revenue)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(report.summary.total_cogs)}</td>
                      <td className={
                        'px-4 py-3 text-sm text-right ' +
                        (report.summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600')
                      }>
                        {formatCurrency(report.summary.total_profit)}
                      </td>
                      <td className={
                        'px-4 py-3 text-sm text-right ' +
                        (report.summary.margin_percentage >= 0 ? 'text-green-600' : 'text-red-600')
                      }>
                        {report.summary.margin_percentage}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
