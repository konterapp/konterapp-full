'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';

interface BranchOption {
  uuid: string;
  name: string;
}

interface SupplierOption {
  uuid: string;
  name: string;
}

interface PayableRow {
  uuid: string;
  purchase_number: string;
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: 'pending' | 'partial' | string;
  branch?: { uuid: string; name: string; code?: string | null } | null;
  supplier?: { uuid: string; name: string; code?: string | null; phone?: string | null } | null;
}

interface PayableSummary {
  invoice_count: number;
  supplier_count: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
}

const initialSummary: PayableSummary = {
  invoice_count: 0,
  supplier_count: 0,
  total_amount: 0,
  paid_amount: 0,
  outstanding_amount: 0,
};

export default function PayablesPage() {
  const [rows, setRows] = useState<PayableRow[]>([]);
  const [summary, setSummary] = useState<PayableSummary>(initialSummary);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('purchase_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
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

  const fetchPayables = useCallback(async () => {
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
      if (filterSupplier) params.set('supplier_uuid', filterSupplier);
      if (filterStatus) params.set('payment_status', filterStatus);
      if (filterDateFrom) params.set('start_date', filterDateFrom);
      if (filterDateTo) params.set('end_date', filterDateTo);

      const response = await fetch(`/api/admin/pos/payables?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setRows(result.data.data || []);
        setSummary(result.data.summary || initialSummary);
        setBranches(result.data.filters?.branches || []);
        setSuppliers(result.data.filters?.suppliers || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
      } else {
        setRows([]);
        setSummary(initialSummary);
        setError(result.message || 'Gagal memuat data hutang');
      }
    } catch {
      setRows([]);
      setSummary(initialSummary);
      setError('Terjadi kesalahan saat memuat data hutang');
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
    filterSupplier,
    filterStatus,
    filterDateFrom,
    filterDateTo,
  ]);

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  const hasActiveFilters = useMemo(
    () => !!(filterBranch || filterSupplier || filterStatus || filterDateFrom || filterDateTo),
    [filterBranch, filterSupplier, filterStatus, filterDateFrom, filterDateTo]
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
    setFilterSupplier('');
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

  const columns: Column<PayableRow>[] = [
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
      key: 'purchase_number',
      label: 'No. Pembelian',
      sortable: true,
      sortValue: (row) => row.purchase_number,
      width: '11rem',
      render: (_, row) => <p className="text-sm font-medium text-gray-900">{row.purchase_number}</p>,
    },
    {
      key: 'purchase_date',
      label: 'Tanggal',
      sortable: true,
      sortValue: (row) => row.purchase_date,
      width: '9rem',
      render: (_, row) => <p className="text-sm text-gray-700">{formatDate(row.purchase_date)}</p>,
    },
    {
      key: 'branch',
      label: 'Cabang',
      sortable: false,
      width: '10rem',
      render: (_, row) => <p className="text-sm text-gray-900">{row.branch?.name || '-'}</p>,
    },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: false,
      render: (_, row) => (
        <div>
          <p className="text-sm text-gray-900">{row.supplier?.name || '-'}</p>
          <p className="text-xs text-gray-500">{row.supplier?.code || ''}</p>
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
      label: 'Sisa Hutang',
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Hutang</h1>
        <p className="mt-1 text-gray-600">Daftar pembelian yang belum lunas dan sisa hutangnya ke supplier.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Hutang</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{formatCurrency(summary.outstanding_amount)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Invoice Belum Lunas</p>
          <p className="mt-2 text-2xl font-bold text-[#142D52]">{summary.invoice_count}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Supplier Belum Lunas</p>
          <p className="mt-2 text-2xl font-bold text-[#142D52]">{summary.supplier_count}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Filter Hutang</h3>
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
            <label className="mb-1 block text-xs text-gray-500">Supplier</label>
            <select
              value={filterSupplier}
              onChange={(e) => {
                setFilterSupplier(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.uuid} value={supplier.uuid}>
                  {supplier.name}
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
        searchPlaceholder="Cari no pembelian, supplier, atau kode supplier..."
        emptyMessage="Tidak ada data hutang"
        emptyIcon={<Landmark className="mx-auto h-16 w-16 text-gray-300" />}
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
