'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Eye, Receipt, X } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';

interface Branch {
  uuid: string;
  name: string;
}

interface PaymentMethod {
  uuid: string;
  name: string;
}

interface Sale {
  uuid: string;
  sale_number: string;
  sale_date: string;
  total_amount: number;
  payment_status: string;
  branch?: { uuid: string; name: string };
  customer?: { uuid: string; name: string };
  payment_method?: { uuid: string; name: string };
}

export default function TransactionsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [filterBranch, setFilterBranch] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadFilterOptions = async () => {
    try {
      const [branchRes, pmRes] = await Promise.all([
        fetch('/api/app/pos/branches/list').then((res) => res.json()),
        fetch('/api/app/pos/payment-methods?per_page=1000').then((res) => res.json()),
      ]);

      if (branchRes.status === 'success' && branchRes.data) {
        setBranches(branchRes.data);
      }

      if (pmRes.status === 'success' && pmRes.data) {
        const methods = pmRes.data.data || pmRes.data || [];
        setPaymentMethods(methods);
      }
    } catch {
      // ignore
    }
  };

  const fetchSales = useCallback(async () => {
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
      if (filterPaymentMethod) params.set('payment_method_uuid', filterPaymentMethod);
      if (filterStatus) params.set('payment_status', filterStatus);
      if (filterDateFrom) params.set('start_date', filterDateFrom);
      if (filterDateTo) params.set('end_date', filterDateTo);

      const response = await fetch(`/api/app/pos/transactions?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setSales(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages || 1);
          setTotalItems(result.data.pagination.total || 0);
        }
      } else {
        setError(result.message || 'Gagal memuat data transaksi');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder, filterBranch, filterPaymentMethod, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterBranch('');
    setFilterPaymentMethod('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(filterBranch || filterPaymentMethod || filterStatus || filterDateFrom || filterDateTo);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      pending: 'Belum Dibayar',
      partial: 'Dibayar Sebagian',
      paid: 'Lunas',
    };
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const columns: Column<Sale>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = sales.findIndex((s) => s.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'sale_number',
      label: 'No. Transaksi',
      sortable: true,
      sortValue: (row) => row.sale_number,
      width: '12rem',
      render: (_, row) => <p className="text-sm font-medium text-gray-900">{row.sale_number}</p>,
    },
    {
      key: 'sale_date',
      label: 'Tanggal',
      sortable: true,
      sortValue: (row) => row.sale_date,
      width: '10rem',
      render: (_, row) => <p className="text-sm text-gray-600">{formatDate(row.sale_date)}</p>,
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
      render: (_, row) => <p className="text-sm text-gray-900">{row.customer?.name || 'Walk-in'}</p>,
    },
    {
      key: 'payment_method',
      label: 'Metode Bayar',
      sortable: false,
      width: '10rem',
      render: (_, row) => <p className="text-sm text-gray-900">{row.payment_method?.name || '-'}</p>,
    },
    {
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      sortValue: (row) => row.total_amount,
      width: '12rem',
      render: (_, row) => <p className="text-sm font-semibold text-gray-900">{formatCurrency(row.total_amount)}</p>,
    },
    {
      key: 'payment_status',
      label: 'Status',
      sortable: false,
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
          title="Lihat Detail"
        >
          <Eye className="h-4 w-4 text-gray-600" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Riwayat Transaksi</h1>
        <p className="mt-1 text-gray-600">Daftar semua transaksi penjualan.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Filter Transaksi</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex cursor-pointer items-center space-x-1 text-xs text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3" />
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
            <label className="mb-1 block text-xs text-gray-500">Metode Bayar</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => {
                setFilterPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Metode</option>
              {paymentMethods.map((pm) => (
                <option key={pm.uuid} value={pm.uuid}>
                  {pm.name}
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
              <option value="paid">Lunas</option>
              <option value="partial">Dibayar Sebagian</option>
              <option value="pending">Belum Dibayar</option>
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
        data={sales}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari transaksi..."
        emptyMessage="Belum ada transaksi"
        emptyIcon={<Receipt className="mx-auto h-16 w-16 text-gray-300" />}
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
      />
    </div>
  );
}
