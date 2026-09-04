'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronDown, Eye, Receipt, SlidersHorizontal, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';

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
  notes?: string | null;
  // Terisi cuma utk sale sintetis komisi Agen Bank -- FK asli balik ke
  // transaksi asalnya (lihat modul bank-agent-transactions).
  bank_agent_transaction_uuid?: string | null;
  items?: Array<{ product?: { name: string } | null }>;
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
  // Panel filter dilipat KHUSUS di bawah lg. Lima field yang selalu terbuka
  // menumpuk vertikal di HP dan mendorong tabel jauh ke bawah layar. Di
  // desktop panel ini tetap terbuka permanen seperti sebelumnya.
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
        fetch('/api/app/pos/branches/options').then((res) => res.json()),
        fetch('/api/app/pos/saldo?per_page=1000').then((res) => res.json()),
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

  const activeFilterCount = [filterBranch, filterPaymentMethod, filterStatus, filterDateFrom, filterDateTo].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

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

  // Sale sintetis (mis. komisi Agen Bank) pakai notes-nya sendiri sbg
  // keterangan (sudah berisi teks jelas spt "Komisi Tarik Tunai (BA-...)");
  // penjualan biasa pakai nama produk.
  const getKeterangan = (row: Sale): string => {
    if (row.bank_agent_transaction_uuid && row.notes) return row.notes;
    if (row.items && row.items.length === 1) return row.items[0].product?.name || '-';
    if (row.items && row.items.length > 1) return `${row.items[0].product?.name || 'Produk'} +${row.items.length - 1} lainnya`;
    return row.notes || '-';
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

  // Tampilan kartu untuk layar kecil -- tabelnya 10 kolom, di HP itu jadi
  // scroll horizontal panjang dan kolom Total serta Status (dua hal yang
  // paling dicari) ada di ujung kanan alias tidak terlihat tanpa menggeser.
  const renderSaleCard = (row: Sale) => (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        {/* min-w-0 wajib: tanpa itu flex child menolak menyusut & nomor
            transaksi yang panjang bikin overflow horizontal. */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{row.sale_number}</p>
          <p className="truncate text-xs text-gray-400">{formatDate(row.sale_date)}</p>
        </div>
        <div className="shrink-0">{getStatusBadge(row.payment_status)}</div>
      </div>

      <p className="truncate text-sm text-gray-600">{getKeterangan(row)}</p>

      <p className="text-lg font-bold text-gray-900">{formatCurrency(row.total_amount)}</p>

      <p className="truncate text-xs text-gray-500">
        {row.branch?.name || '-'} &middot; {row.customer?.name || 'Walk-in'} &middot; {row.payment_method?.name || '-'}
      </p>

      {/* Aksi berlabel teks & 44px: di layar sentuh tidak ada hover, jadi
          ikon mata bertooltip seperti versi tabel tidak akan terbaca. */}
      <div className="border-t border-gray-100 pt-2.5">
        <Link
          href={`/app/pos/transactions/${row.uuid}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#EBC170] text-xs font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer"
        >
          Lihat Detail
        </Link>
      </div>
    </div>
  );

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
      key: 'keterangan',
      label: 'Keterangan',
      sortable: false,
      render: (_, row) => <p className="text-sm text-gray-600 truncate max-w-xs">{getKeterangan(row)}</p>,
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
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#142D52]">Riwayat Transaksi</h1>
        <p className="mt-1 text-sm sm:text-base text-gray-600">Daftar semua transaksi penjualan.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 lg:mb-3">
          {/* Di bawah lg judulnya jadi tombol lipat; mulai lg dia kembali
              jadi teks biasa karena panelnya memang selalu terbuka. */}
          <button
            type="button"
            onClick={() => setShowMobileFilters((prev) => !prev)}
            aria-expanded={showMobileFilters}
            className="flex min-h-11 flex-1 items-center gap-2 text-left text-sm font-semibold text-gray-700 cursor-pointer lg:min-h-0 lg:cursor-default"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-500 lg:hidden" />
            <span>Filter Transaksi</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#142D52] px-2 py-0.5 text-[10px] font-bold text-[#EBC170] lg:hidden">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-500 transition-transform lg:hidden ${showMobileFilters ? 'rotate-180' : ''}`}
            />
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex min-h-11 shrink-0 cursor-pointer items-center space-x-1 text-xs text-red-600 hover:text-red-700 lg:min-h-0"
            >
              <X className="h-3 w-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
        <div
          className={`grid-cols-1 gap-3 md:grid-cols-3 lg:grid lg:grid-cols-5 ${
            showMobileFilters ? 'mt-3 grid lg:mt-0' : 'hidden'
          }`}
        >
          <div>
            <label className="mb-1 block text-xs text-gray-500">Cabang</label>
            <select
              value={filterBranch}
              onChange={(e) => {
                setFilterBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full min-h-11 cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170] lg:min-h-0 lg:text-sm"
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
              className="w-full min-h-11 cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170] lg:min-h-0 lg:text-sm"
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
              className="w-full min-h-11 cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170] lg:min-h-0 lg:text-sm"
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
              className="w-full min-h-11 cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170] lg:min-h-0 lg:text-sm"
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
              className="w-full min-h-11 cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170] lg:min-h-0 lg:text-sm"
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
        getRowId={(row) => row.uuid}
        renderMobileCard={renderSaleCard}
      />
    </div>
  );
}
