'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Eye, Wallet } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';

interface BranchOption {
  uuid: string;
  name: string;
}

interface CustomerOption {
  uuid: string;
  name: string;
}

interface ReceivableRow {
  uuid: string;
  sale_number: string;
  sale_date: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: 'pending' | 'partial' | string;
  branch?: { uuid: string; name: string; code?: string | null } | null;
  customer?: { uuid: string; name: string; phone?: string | null } | null;
}

interface ReceivableSummary {
  invoice_count: number;
  customer_count: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
}

const initialSummary: ReceivableSummary = {
  invoice_count: 0,
  customer_count: 0,
  total_amount: 0,
  paid_amount: 0,
  outstanding_amount: 0,
};

export default function ReceivablesPage() {
  const [rows, setRows] = useState<ReceivableRow[]>([]);
  const [summary, setSummary] = useState<ReceivableSummary>(initialSummary);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('sale_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchReceivables = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage.toString(),
        search: debouncedSearch,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (filterBranch) params.set('branch_uuid', filterBranch);
      if (filterCustomer) params.set('customer_uuid', filterCustomer);
      if (filterStatus) params.set('payment_status', filterStatus);
      if (filterDateFrom) params.set('start_date', filterDateFrom);
      if (filterDateTo) params.set('end_date', filterDateTo);

      const response = await fetch(`/api/app/pos/receivables?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setRows(result.data.data || []);
        setSummary(result.data.summary || initialSummary);
        setBranches(result.data.filters?.branches || []);
        setCustomers(result.data.filters?.customers || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
      } else {
        setRows([]);
        setSummary(initialSummary);
        setError(result.message || 'Gagal memuat data piutang');
      }
    } catch {
      setRows([]);
      setSummary(initialSummary);
      setError('Terjadi kesalahan saat memuat data piutang');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearch,
    sortBy,
    sortOrder,
    filterBranch,
    filterCustomer,
    filterStatus,
    filterDateFrom,
    filterDateTo,
  ]);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  const hasActiveFilters = useMemo(
    () => !!(filterBranch || filterCustomer || filterStatus || filterDateFrom || filterDateTo),
    [filterBranch, filterCustomer, filterStatus, filterDateFrom, filterDateTo]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getStatusBadge = (status: string) => {
    const styleMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    const labelMap: Record<string, string> = {
      pending: 'Belum Dibayar',
      partial: 'Dibayar Sebagian',
    };

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styleMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  const clearFilters = () => {
    setFilterBranch('');
    setFilterCustomer('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const columns: Column<ReceivableRow>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = rows.findIndex((item) => item.uuid === row.uuid);
        return <span className="text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
      },
    },
    {
      key: 'sale_number',
      label: 'No. Invoice',
      sortable: true,
      sortValue: (row) => row.sale_number,
      width: '11rem',
      render: (_, row) => <p className="text-sm font-medium text-gray-900">{row.sale_number}</p>,
    },
    {
      key: 'sale_date',
      label: 'Tanggal',
      sortable: true,
      sortValue: (row) => row.sale_date,
      width: '9rem',
      render: (_, row) => <p className="text-sm text-gray-700">{formatDate(row.sale_date)}</p>,
    },
    {
      key: 'branch',
      label: 'Cabang',
      sortable: false,
      width: '10rem',
      render: (_, row) => <p className="text-sm text-gray-900">{row.branch?.name || '-'}</p>,
    },
    {
      key: 'customer',
      label: 'Pelanggan',
      sortable: false,
      render: (_, row) => (
        <div>
          <p className="text-sm text-gray-900">{row.customer?.name || 'Walk-in'}</p>
          {row.customer?.phone && <p className="text-xs text-gray-500">{row.customer.phone}</p>}
        </div>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total Tagihan',
      sortable: true,
      sortValue: (row) => row.total_amount,
      width: '12rem',
      render: (_, row) => <p className="text-sm text-gray-900">{formatCurrency(row.total_amount)}</p>,
    },
    {
      key: 'paid_amount',
      label: 'Sudah Dibayar',
      sortable: true,
      sortValue: (row) => row.paid_amount,
      width: '12rem',
      render: (_, row) => <p className="text-sm text-green-700">{formatCurrency(row.paid_amount)}</p>,
    },
    {
      key: 'outstanding_amount',
      label: 'Sisa Piutang',
      sortable: false,
      width: '12rem',
      render: (_, row) => <p className="text-sm font-semibold text-red-700">{formatCurrency(row.outstanding_amount)}</p>,
    },
    {
      key: 'payment_status',
      label: 'Status',
      sortable: true,
      sortValue: (row) => row.payment_status,
      width: '10rem',
      render: (_, row) => getStatusBadge(row.payment_status),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      render: (_, row) => (
        <Link
          href={`/app/pos/transactions/${row.uuid}`}
          className="inline-flex cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
          title="Lihat Detail Transaksi"
        >
          <Eye className="h-4 w-4 text-gray-600" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Piutang</h1>
        <p className="mt-1 text-gray-600">Daftar penjualan yang belum lunas dan sisa tagihannya.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Piutang</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{formatCurrency(summary.outstanding_amount)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Invoice Belum Lunas</p>
          <p className="mt-2 text-2xl font-bold text-[#142D52]">{summary.invoice_count}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pelanggan Berpiutang</p>
          <p className="mt-2 text-2xl font-bold text-[#142D52]">{summary.customer_count}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Filter Piutang</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex cursor-pointer items-center space-x-1 text-xs text-red-600 hover:text-red-700"
            >
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Cabang</label>
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Cabang</option>
              {branches.map((branch) => (
                <option key={branch.uuid} value={branch.uuid}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Pelanggan</label>
            <select
              value={filterCustomer}
              onChange={(e) => {
                setFilterCustomer(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Pelanggan</option>
              {customers.map((customer) => (
                <option key={customer.uuid} value={customer.uuid}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Status</option>
              <option value="pending">Belum Dibayar</option>
              <option value="partial">Dibayar Sebagian</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Dari Tanggal</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => {
                setFilterDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Sampai Tanggal</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => {
                setFilterDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            />
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <DataTable
        data={rows}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari invoice, pelanggan, atau nomor telepon..."
        emptyMessage="Tidak ada data piutang"
        emptyIcon={<Wallet className="mx-auto h-16 w-16 text-gray-300" />}
        serverSide={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        isLoading={isLoading}
        getRowId={(row) => row.uuid}
      />
    </div>
  );
}
