'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, X, Zap } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useToast } from '@/components/toast/ToastContainer';

interface Branch {
  uuid: string;
  name: string;
}

interface PpobTransaction {
  uuid: string;
  transaction_number: string;
  type: string;
  product_name: string;
  customer_number: string;
  selling_price: number;
  profit: number;
  provider: string;
  provider_label?: string;
  status: string;
  created_at: string;
}

export default function PpobTransactionsPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();

  const [transactions, setTransactions] = useState<PpobTransaction[]>([]);
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
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder, filterBranch, filterStatus, filterType, filterDateFrom, filterDateTo]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/app/pos/branches/options');
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setBranches(result.data);
      }
    } catch {
      setBranches([]);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: itemsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterBranch) params.set('branch_uuid', filterBranch);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      if (filterDateFrom) params.set('date_from', filterDateFrom);
      if (filterDateTo) params.set('date_to', filterDateTo);

      const response = await fetch(`/api/app/pos/ppob/transactions?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setTransactions(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages || 1);
          setTotalItems(result.data.pagination.total || 0);
        }
      } else {
        setError(result.message || 'Gagal memuat data transaksi PPOB');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data transaksi PPOB');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async (uuid: string) => {
    setCheckingStatus(uuid);

    try {
      const response = await fetch(`/api/app/pos/ppob/transactions/${uuid}/check-status`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Status transaksi berhasil diperbarui');
        fetchTransactions();
      } else {
        toast.error(result.message || 'Gagal cek status transaksi');
      }
    } catch {
      toast.error('Terjadi kesalahan saat cek status');
    } finally {
      setCheckingStatus(null);
    }
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterBranch('');
    setFilterStatus('');
    setFilterType('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(filterBranch || filterStatus || filterType || filterDateFrom || filterDateTo);

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      success: { className: 'bg-green-100 text-green-800', label: 'Sukses' },
      failed: { className: 'bg-red-100 text-red-800', label: 'Gagal' },
    };

    const current = config[status] || { className: 'bg-gray-100 text-gray-800', label: status };

    return <span className={`rounded-full px-2 py-1 text-xs font-medium ${current.className}`}>{current.label}</span>;
  };

  const columns: Column<PpobTransaction>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = transactions.findIndex((t) => t.uuid === row.uuid);
        return <span className="text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
      },
    },
    {
      key: 'transaction_number',
      label: 'No. Transaksi',
      sortable: true,
      sortValue: (row) => row.transaction_number,
      width: '12rem',
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.transaction_number}</p>
          <p className="text-xs text-gray-500">{row.type === 'prepaid' ? 'Prabayar' : 'Pascabayar'}</p>
        </div>
      ),
    },
    {
      key: 'product_name',
      label: 'Produk',
      sortable: false,
      render: (_, row) => (
        <div>
          <p className="text-sm text-gray-900">{row.product_name}</p>
          <p className="text-xs text-gray-500">{row.customer_number}</p>
        </div>
      ),
    },
    {
      key: 'selling_price',
      label: 'Harga Jual',
      sortable: true,
      sortValue: (row) => row.selling_price,
      width: '10rem',
      render: (_, row) => <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(row.selling_price))}</p>,
    },
    {
      key: 'profit',
      label: 'Profit',
      sortable: true,
      sortValue: (row) => row.profit,
      width: '8rem',
      render: (_, row) => (
        <p className={`text-sm font-medium ${Number(row.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(Number(row.profit))}
        </p>
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      sortable: false,
      width: '7rem',
      render: (_, row) => (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            row.provider === 'rajabiller'
              ? 'bg-blue-100 text-blue-700'
              : row.provider === 'digiflazz'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.provider_label || row.provider || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      width: '8rem',
      render: (_, row) => getStatusBadge(row.status),
    },
    {
      key: 'created_at',
      label: 'Tanggal',
      sortable: true,
      sortValue: (row) => row.created_at,
      width: '12rem',
      render: (_, row) => <p className="text-sm text-gray-600">{formatDate(row.created_at)}</p>,
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      width: '5rem',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {hasPermission('pos.ppob.create') && row.status === 'pending' && (
            <button
              onClick={() => handleCheckStatus(row.uuid)}
              disabled={checkingStatus === row.uuid}
              className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
              title="Cek Status"
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${checkingStatus === row.uuid ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Riwayat PPOB</h1>
        <p className="mt-1 text-gray-600">Daftar semua transaksi PPOB.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Filter Transaksi PPOB</h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex cursor-pointer items-center space-x-1 text-xs text-red-600 hover:text-red-700">
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
            <label className="mb-1 block text-xs text-gray-500">Tipe</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Tipe</option>
              <option value="prepaid">Prabayar</option>
              <option value="postpaid">Pascabayar</option>
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
              <option value="pending">Pending</option>
              <option value="success">Sukses</option>
              <option value="failed">Gagal</option>
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
        data={transactions}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari no. transaksi, produk, atau pelanggan..."
        emptyMessage="Tidak ada transaksi PPOB ditemukan"
        emptyIcon={<Zap className="mx-auto h-16 w-16 text-gray-300" />}
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
