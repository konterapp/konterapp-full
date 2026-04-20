'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  CreditCard,
  Landmark,
  Package,
  ReceiptText,
  RefreshCw,
  ShoppingBasket,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { allMenuItems } from './_constants/menuItems';
import { useUser } from './_context/UserContext';
import { filterMenuByAccess } from '@/lib/utils/menuFilter';

type ApiResponse<T> = {
  status: 'success' | 'error';
  message: string;
  data?: T;
};

type ListResponse<T> = {
  data: T[];
  pagination?: {
    total?: number;
  };
  summary?: {
    outstanding_amount?: number;
  };
  active_shift?: {
    uuid: string;
    opened_at: string;
    branch: { uuid: string; name: string; code?: string } | null;
    current_total_sales: number;
    current_expected_cash: number;
  } | null;
};

type BranchListResponse = Array<{ uuid: string; name: string; code?: string }>;

type ReportSummaryResponse = {
  summary?: {
    total_revenue?: number;
    total_profit?: number;
    total_transactions?: number;
  };
};

type SaleListItem = {
  uuid: string;
  sale_number: string;
  sale_date: string;
  total_amount: number;
  payment_status: string;
  customer?: { name?: string | null } | null;
  branch?: { name?: string | null; code?: string | null } | null;
};

type DashboardMetrics = {
  salesCount: number;
  productCount: number;
  customerCount: number;
  purchaseCount: number;
  branchCount: number;
  receivableOutstanding: number;
  payableOutstanding: number;
  monthRevenue: number;
  monthProfit: number;
};

const paymentStatusLabel: Record<string, string> = {
  paid: 'Lunas',
  partial: 'Sebagian',
  pending: 'Belum Bayar',
};

const numberFormatter = new Intl.NumberFormat('id-ID');
const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const initialMetrics: DashboardMetrics = {
  salesCount: 0,
  productCount: 0,
  customerCount: 0,
  purchaseCount: 0,
  branchCount: 0,
  receivableOutstanding: 0,
  payableOutstanding: 0,
  monthRevenue: 0,
  monthProfit: 0,
};

function toNumber(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const toDateString = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    from: toDateString(start),
    to: toDateString(now),
  };
}

async function fetchApi<T>(url: string): Promise<ApiResponse<T> | null> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const { user, roles, permissions, adminScope, isLoading } = useUser();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [activeShift, setActiveShift] = useState<ListResponse<never>['active_shift']>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const quickMenus = useMemo(() => {
    const filtered = filterMenuByAccess(allMenuItems, {
      permissions,
      roles,
      adminScope,
    });

    return filtered
      .filter((item) => !item.isPlaceholder && item.href)
      .slice(0, 10);
  }, [permissions, roles, adminScope]);

  const loadDashboardData = useCallback(async () => {
    if (isLoading) return;

    setIsRefreshing(true);
    setLoadError(null);

    const canViewSales = permissions.includes('admin.pos.sale.index');
    const canViewProducts = permissions.includes('admin.pos.product.index');
    const canViewCustomers = permissions.includes('admin.pos.sale.create');
    const canViewPurchases = permissions.includes('admin.pos.purchase.index');
    const canViewBranches = permissions.includes('admin.pos.branch.index');
    const canViewReport = permissions.includes('admin.pos.report.index');

    const { from, to } = getMonthRange();

    const [salesRes, productsRes, customersRes, purchasesRes, branchesRes, receivablesRes, payablesRes, reportRes, shiftsRes] =
      await Promise.all([
        canViewSales
          ? fetchApi<ListResponse<SaleListItem>>('/api/admin/pos/transactions?page=1&per_page=6&sort_by=created_at&sort_order=desc')
          : Promise.resolve(null),
        canViewProducts
          ? fetchApi<ListResponse<unknown>>('/api/admin/pos/products?page=1&per_page=1&is_active=true')
          : Promise.resolve(null),
        canViewCustomers
          ? fetchApi<ListResponse<unknown>>('/api/admin/pos/customers?page=1&per_page=1')
          : Promise.resolve(null),
        canViewPurchases
          ? fetchApi<ListResponse<unknown>>('/api/admin/pos/purchases?page=1&per_page=1&sort_by=created_at&sort_order=desc')
          : Promise.resolve(null),
        canViewBranches
          ? fetchApi<BranchListResponse>('/api/admin/pos/branches/list')
          : Promise.resolve(null),
        canViewSales
          ? fetchApi<ListResponse<unknown>>('/api/admin/pos/receivables?page=1&per_page=1')
          : Promise.resolve(null),
        canViewPurchases
          ? fetchApi<ListResponse<unknown>>('/api/admin/pos/payables?page=1&per_page=1')
          : Promise.resolve(null),
        canViewReport
          ? fetchApi<ReportSummaryResponse>(`/api/admin/pos/reports/profit-loss?date_from=${from}&date_to=${to}`)
          : Promise.resolve(null),
        canViewCustomers
          ? fetchApi<ListResponse<unknown>>('/api/admin/pos/shifts?page=1&per_page=1')
          : Promise.resolve(null),
      ]);

    const nextMetrics: DashboardMetrics = {
      salesCount: toNumber(salesRes?.data?.pagination?.total),
      productCount: toNumber(productsRes?.data?.pagination?.total),
      customerCount: toNumber(customersRes?.data?.pagination?.total),
      purchaseCount: toNumber(purchasesRes?.data?.pagination?.total),
      branchCount: Array.isArray(branchesRes?.data) ? branchesRes.data.length : 0,
      receivableOutstanding: toNumber(receivablesRes?.data?.summary?.outstanding_amount),
      payableOutstanding: toNumber(payablesRes?.data?.summary?.outstanding_amount),
      monthRevenue: toNumber(reportRes?.data?.summary?.total_revenue),
      monthProfit: toNumber(reportRes?.data?.summary?.total_profit),
    };

    setMetrics(nextMetrics);
    setSales(Array.isArray(salesRes?.data?.data) ? salesRes.data.data : []);
    setActiveShift(shiftsRes?.data?.active_shift || null);

    const hasAnyResponse = [
      salesRes,
      productsRes,
      customersRes,
      purchasesRes,
      branchesRes,
      receivablesRes,
      payablesRes,
      reportRes,
      shiftsRes,
    ].some((item) => item !== null);

    if (!hasAnyResponse) {
      setLoadError('Gagal memuat data dashboard. Silakan coba refresh.');
    }

    setIsRefreshing(false);
  }, [isLoading, permissions]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      void loadDashboardData();
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#142D52]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error === 'unauthorized' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Akses Ditolak</h3>
              <p className="text-sm text-red-700 mt-1">
                Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika ini adalah kesalahan.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl overflow-hidden border border-[#142D52]/15 shadow-sm bg-gradient-to-br from-[#142D52] via-[#1a3d69] to-[#24517f]">
        <div className="px-6 py-6 lg:px-8 lg:py-8 text-white">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[#EBC170] text-sm font-semibold tracking-wide uppercase">Dashboard Admin</p>
              <h1 className="text-2xl lg:text-3xl font-bold mt-1">Selamat datang, {user?.name || 'User'}</h1>
              <p className="text-white/85 mt-2 max-w-2xl text-sm lg:text-base">
                Pantau penjualan, stok, dan operasional kasir dalam satu layar. Data di bawah otomatis menyesuaikan hak akses akun Anda.
              </p>
            </div>

            <div className="flex flex-col gap-2 lg:items-end">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm">
                <CalendarClock className="w-4 h-4 text-[#EBC170]" />
                <span>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date())}</span>
              </div>
              <button
                type="button"
                onClick={loadDashboardData}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EBC170] text-[#142D52] text-sm font-semibold hover:bg-[#f3cf8f] disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>

          {roles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span key={role} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 border border-white/20">
                  {role}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Omzet Bulan Ini</p>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{currencyFormatter.format(metrics.monthRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Profit: {currencyFormatter.format(metrics.monthProfit)}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Penjualan</p>
            <ReceiptText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{numberFormatter.format(metrics.salesCount)}</p>
          <p className="text-xs text-gray-500 mt-1">Total transaksi tercatat</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Produk Aktif</p>
            <Package className="w-5 h-5 text-violet-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{numberFormatter.format(metrics.productCount)}</p>
          <p className="text-xs text-gray-500 mt-1">Siap dijual di POS</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pelanggan</p>
            <Users className="w-5 h-5 text-pink-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{numberFormatter.format(metrics.customerCount)}</p>
          <p className="text-xs text-gray-500 mt-1">Basis pelanggan tersimpan</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pembelian</p>
            <ShoppingBasket className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{numberFormatter.format(metrics.purchaseCount)}</p>
          <p className="text-xs text-gray-500 mt-1">Total dokumen pembelian</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Cabang Aktif</p>
            <Building2 className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{numberFormatter.format(metrics.branchCount)}</p>
          <p className="text-xs text-gray-500 mt-1">Terdaftar di sistem POS</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Shift Kasir</p>
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          {activeShift ? (
            <>
              <p className="text-lg font-bold text-emerald-700 mt-2">Sedang Berjalan</p>
              <p className="text-xs text-gray-600 mt-1">
                {activeShift.branch?.name || '-'} • dibuka {formatDateTime(activeShift.opened_at)}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-gray-700 mt-2">Belum Ada Shift Aktif</p>
              <p className="text-xs text-gray-500 mt-1">Buka shift dari menu Shift Kasir sebelum transaksi</p>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700">Piutang Berjalan</p>
            <Wallet className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900 mt-2">{currencyFormatter.format(metrics.receivableOutstanding)}</p>
          <Link href="/admin/pos/receivables" className="inline-flex items-center gap-1 mt-3 text-sm text-red-700 font-medium hover:text-red-900">
            Lihat Piutang <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-amber-700">Hutang Berjalan</p>
            <Landmark className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{currencyFormatter.format(metrics.payableOutstanding)}</p>
          <Link href="/admin/pos/payables" className="inline-flex items-center gap-1 mt-3 text-sm text-amber-700 font-medium hover:text-amber-900">
            Lihat Hutang <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Transaksi Terbaru</h2>
              <p className="text-xs text-gray-500 mt-0.5">Penjualan terbaru dari POS</p>
            </div>
            <Link href="/admin/pos/transactions" className="text-sm text-[#142D52] font-medium hover:underline">
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">No. Invoice</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Pelanggan</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Cabang</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Belum ada data transaksi atau Anda belum memiliki akses.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.uuid} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="font-medium">{sale.sale_number}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(sale.sale_date)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.customer?.name || 'Walk-in Customer'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{sale.branch?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                          {paymentStatusLabel[sale.payment_status] || sale.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {currencyFormatter.format(toNumber(sale.total_amount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Akses Cepat</h2>
            <p className="text-xs text-gray-500 mt-0.5">Menu utama sesuai permission Anda</p>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
            {quickMenus.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Belum ada menu yang tersedia.</div>
            ) : (
              quickMenus.map((menu) => (
                <Link
                  key={`${menu.section}-${menu.label}`}
                  href={menu.href || '/admin'}
                  className="group flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 hover:border-[#142D52]/20 hover:bg-[#142D52]/5 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#142D52]">{menu.icon}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{menu.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#142D52]" />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
