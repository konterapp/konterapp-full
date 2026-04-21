'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ReceiptText,
  Wallet,
  Landmark,
} from 'lucide-react';

type ReportMode = 'profit-loss' | 'sales-summary' | 'purchase-summary';

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

type BranchListItem = {
  uuid: string;
  name: string;
};

type PaymentStatusSummaryRow = {
  payment_status: string;
  count: number;
  total_amount: number;
  paid_amount: number;
};

type DailySummaryRow = {
  date: string;
  transactions: number;
  total_amount: number;
};

type SalesRecentTransaction = {
  uuid: string;
  sale_number: string;
  sale_date: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  branch: { uuid: string; name: string; code?: string | null } | null;
  customer: { uuid: string; name: string; phone?: string | null } | null;
};

type PurchaseRecentTransaction = {
  uuid: string;
  purchase_number: string;
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  branch: { uuid: string; name: string; code?: string | null } | null;
  supplier: { uuid: string; name: string; code?: string | null } | null;
};

interface SalesSummaryReport {
  period: { from: string; to: string };
  branch: { uuid: string; name: string } | null;
  summary: {
    total_sales: number;
    total_paid: number;
    outstanding_amount: number;
    total_discount: number;
    total_transactions: number;
    average_ticket: number;
  };
  by_payment_status: PaymentStatusSummaryRow[];
  daily: DailySummaryRow[];
  recent_transactions: SalesRecentTransaction[];
}

interface PurchaseSummaryReport {
  period: { from: string; to: string };
  branch: { uuid: string; name: string } | null;
  summary: {
    total_purchases: number;
    total_paid: number;
    outstanding_amount: number;
    total_discount: number;
    total_transactions: number;
    average_ticket: number;
  };
  by_payment_status: PaymentStatusSummaryRow[];
  daily: DailySummaryRow[];
  recent_transactions: PurchaseRecentTransaction[];
}

const pad2 = (value: number) => String(value).padStart(2, '0');

const reportModeTitle: Record<ReportMode, string> = {
  'profit-loss': 'Laporan Laba/Rugi',
  'sales-summary': 'Ringkasan Penjualan',
  'purchase-summary': 'Ringkasan Pembelian',
};

const reportModeSubtitle: Record<ReportMode, string> = {
  'profit-loss': 'Analisis keuntungan berdasarkan penjualan dan harga beli',
  'sales-summary': 'Ringkasan transaksi penjualan berdasarkan periode dan cabang',
  'purchase-summary': 'Ringkasan transaksi pembelian berdasarkan periode dan cabang',
};

const paymentStatusLabel: Record<string, string> = {
  paid: 'Lunas',
  partial: 'Sebagian',
  pending: 'Belum Bayar',
  draft: 'Draft',
  void: 'Void',
};

const paymentStatusBadge: Record<string, string> = {
  paid: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-red-50 text-red-700 border-red-200',
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  void: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportMode>('profit-loss');
  const [profitLossReport, setProfitLossReport] = useState<ProfitLossReport | null>(null);
  const [salesSummaryReport, setSalesSummaryReport] = useState<SalesSummaryReport | null>(null);
  const [purchaseSummaryReport, setPurchaseSummaryReport] = useState<PurchaseSummaryReport | null>(null);
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
    void loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const response = await fetch('/api/admin/pos/branches/list');
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        const items: BranchListItem[] = result.data.data || result.data || [];
        const options = [
          { uuid: '', name: 'Semua Cabang' },
          ...items.map((branch) => ({ uuid: branch.uuid, name: branch.name })),
        ];
        setBranches(options);
      }
    } catch {
      setBranches([{ uuid: '', name: 'Semua Cabang' }]);
    }
  };

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (branchUuid) params.append('branch_uuid', branchUuid);

      const query = params.toString();
      const endpoint =
        activeReport === 'profit-loss'
          ? '/api/admin/pos/reports/profit-loss'
          : activeReport === 'sales-summary'
            ? '/api/admin/pos/reports/sales-summary'
            : '/api/admin/pos/reports/purchase-summary';

      const response = await fetch(endpoint + (query ? '?' + query : ''));
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        if (activeReport === 'profit-loss') {
          setProfitLossReport(result.data as ProfitLossReport);
        } else if (activeReport === 'sales-summary') {
          setSalesSummaryReport(result.data as SalesSummaryReport);
        } else {
          setPurchaseSummaryReport(result.data as PurchaseSummaryReport);
        }
      } else {
        setError(result.message || 'Gagal memuat laporan');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat laporan');
    } finally {
      setIsLoading(false);
    }
  }, [activeReport, branchUuid, dateFrom, dateTo]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    const tone = paymentStatusBadge[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-md border ${tone}`}>
        {paymentStatusLabel[status] || status}
      </span>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortedProducts = (): ProfitLossProduct[] => {
    if (!profitLossReport?.products) return [];
    return [...profitLossReport.products].sort((a, b) => {
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
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const renderProfitLoss = () => {
    if (!profitLossReport) return null;

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pendapatan</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(profitLossReport.summary.total_revenue)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{profitLossReport.summary.total_transactions} transaksi</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Modal (HPP)</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(profitLossReport.summary.total_cogs)}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{profitLossReport.summary.total_items_sold} item terjual</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Laba Kotor</p>
                <p className={'text-xl font-bold mt-1 ' + (profitLossReport.summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(profitLossReport.summary.total_profit)}
                </p>
              </div>
              <div className={'p-3 rounded-full ' + (profitLossReport.summary.total_profit >= 0 ? 'bg-green-50' : 'bg-red-50')}>
                {profitLossReport.summary.total_profit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Pendapatan - Modal</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Margin</p>
                <p className={'text-xl font-bold mt-1 ' + (profitLossReport.summary.margin_percentage >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {profitLossReport.summary.margin_percentage}%
                </p>
              </div>
              <div className="p-3 bg-violet-50 rounded-full">
                <BarChart3 className="w-5 h-5 text-violet-600" />
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
              <span className="text-xs text-gray-400">({profitLossReport.products.length} produk)</span>
            </div>
          </div>

          {profitLossReport.products.length === 0 ? (
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
                      <td className={'px-4 py-3 text-sm text-right font-medium ' + (product.profit >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {formatCurrency(product.profit)}
                      </td>
                      <td className={'px-4 py-3 text-sm text-right font-medium ' + (product.margin_percentage >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {product.margin_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-3 text-sm" colSpan={2}>Total</td>
                    <td className="px-4 py-3 text-sm text-right">{profitLossReport.summary.total_items_sold}</td>
                    <td className="px-4 py-3" colSpan={2}></td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(profitLossReport.summary.total_revenue)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(profitLossReport.summary.total_cogs)}</td>
                    <td className={'px-4 py-3 text-sm text-right ' + (profitLossReport.summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatCurrency(profitLossReport.summary.total_profit)}
                    </td>
                    <td className={'px-4 py-3 text-sm text-right ' + (profitLossReport.summary.margin_percentage >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {profitLossReport.summary.margin_percentage}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderSummaryBlock = (
    report: SalesSummaryReport | PurchaseSummaryReport,
    mode: 'sales' | 'purchase'
  ) => {
    const isSales = mode === 'sales';

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{isSales ? 'Total Penjualan' : 'Total Pembelian'}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatCurrency(isSales ? report.summary.total_sales : report.summary.total_purchases)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                {isSales ? <ReceiptText className="w-5 h-5 text-blue-600" /> : <Landmark className="w-5 h-5 text-blue-600" />}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{report.summary.total_transactions} transaksi</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Dibayar</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(report.summary.total_paid)}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-full">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Rata-rata: {formatCurrency(report.summary.average_ticket)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Outstanding</p>
                <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(report.summary.outstanding_amount)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <Wallet className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Belum terbayar</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Diskon</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(report.summary.total_discount)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Diskon transaksi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700">Distribusi Status Pembayaran</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">Dibayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.by_payment_status.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Tidak ada data</td>
                    </tr>
                  ) : (
                    report.by_payment_status.map((row) => (
                      <tr key={row.payment_status}>
                        <td className="px-4 py-3 text-sm">{getStatusBadge(row.payment_status)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{row.count}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(row.total_amount)}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(row.paid_amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700">Tren Harian</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                    <th className="px-4 py-3 text-right font-medium">Transaksi</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.daily.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">Tidak ada data</td>
                    </tr>
                  ) : (
                    report.daily.map((row) => (
                      <tr key={row.date}>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.date}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{row.transactions}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(row.total_amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">
              {isSales ? 'Transaksi Penjualan Terbaru' : 'Transaksi Pembelian Terbaru'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-medium">Nomor</th>
                  <th className="px-4 py-3 text-left font-medium">Relasi</th>
                  <th className="px-4 py-3 text-left font-medium">Cabang</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Dibayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.recent_transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Tidak ada data transaksi</td>
                  </tr>
                ) : (
                  report.recent_transactions.map((row) => (
                    <tr key={row.uuid}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {'sale_number' in row ? row.sale_number : row.purchase_number}
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatDateTime('sale_date' in row ? row.sale_date : row.purchase_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {'customer' in row ? row.customer?.name || 'Walk-in Customer' : row.supplier?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.branch?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(row.payment_status)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(row.total_amount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(row.paid_amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">{reportModeTitle[activeReport]}</h1>
          <p className="text-gray-600 mt-1">{reportModeSubtitle[activeReport]}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveReport('profit-loss')}
            className={`cursor-pointer px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              activeReport === 'profit-loss'
                ? 'bg-[#142D52] text-white border-[#142D52]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Laba/Rugi
          </button>
          <button
            type="button"
            onClick={() => setActiveReport('sales-summary')}
            className={`cursor-pointer px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              activeReport === 'sales-summary'
                ? 'bg-[#142D52] text-white border-[#142D52]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Ringkasan Penjualan
          </button>
          <button
            type="button"
            onClick={() => setActiveReport('purchase-summary')}
            className={`cursor-pointer px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              activeReport === 'purchase-summary'
                ? 'bg-[#142D52] text-white border-[#142D52]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Ringkasan Pembelian
          </button>
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
                <option key={branch.uuid || 'all'} value={branch.uuid}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBC170]" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && !error && activeReport === 'profit-loss' && renderProfitLoss()}
      {!isLoading && !error && activeReport === 'sales-summary' && salesSummaryReport && renderSummaryBlock(salesSummaryReport, 'sales')}
      {!isLoading && !error && activeReport === 'purchase-summary' && purchaseSummaryReport && renderSummaryBlock(purchaseSummaryReport, 'purchase')}
    </div>
  );
}
