'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Shuffle, Plus, ArrowRight } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface BranchOption {
  uuid: string;
  name: string;
}

interface ProductOption {
  uuid: string;
  name: string;
}

interface StockTransferHistoryItem {
  uuid: string;
  quantity: number;
  product?: {
    uuid: string;
    name: string;
    sku?: string | null;
    unit?: string | null;
  } | null;
}

interface StockTransferHistoryDocument {
  reference_uuid: string;
  created_at: string;
  notes: string | null;
  items_count: number;
  total_quantity: number;
  from_branch?: { uuid: string; name: string } | null;
  to_branch?: { uuid: string; name: string } | null;
  creator?: { id: number; name: string; email: string } | null;
  items: StockTransferHistoryItem[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function shortenUuid(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

export default function StockTransfersPage() {
  const { hasPermission } = usePermissions();

  const [rows, setRows] = useState<StockTransferHistoryDocument[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    from_branch_uuid: '',
    to_branch_uuid: '',
    product_uuid: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHistory = useCallback(
    async (page: number) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          scope: 'history',
          page: String(page),
          per_page: String(itemsPerPage),
          search: debouncedSearch,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
        if (filters.from_branch_uuid) params.append('from_branch_uuid', filters.from_branch_uuid);
        if (filters.to_branch_uuid) params.append('to_branch_uuid', filters.to_branch_uuid);
        if (filters.product_uuid) params.append('product_uuid', filters.product_uuid);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);

        const response = await fetch(`/api/app/pos/stock-transfers?${params.toString()}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          setRows(result.data.data || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalItems(result.data.pagination?.total || 0);
          setBranches(result.data.filters?.branches || []);
          setProducts(result.data.filters?.products || []);
        } else {
          setRows([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } catch {
        setRows([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [
      itemsPerPage,
      debouncedSearch,
      sortBy,
      sortOrder,
      filters.from_branch_uuid,
      filters.to_branch_uuid,
      filters.product_uuid,
      filters.date_from,
      filters.date_to,
    ]
  );

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, fetchHistory]);

  const filterComponent = useMemo(
    () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cabang Asal</label>
          <select
            value={filters.from_branch_uuid}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, from_branch_uuid: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          >
            <option value="">Semua Cabang</option>
            {branches.map((branch) => (
              <option key={branch.uuid} value={branch.uuid}>{branch.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cabang Tujuan</label>
          <select
            value={filters.to_branch_uuid}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, to_branch_uuid: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          >
            <option value="">Semua Cabang</option>
            {branches.map((branch) => (
              <option key={branch.uuid} value={branch.uuid}>{branch.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
          <select
            value={filters.product_uuid}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, product_uuid: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          >
            <option value="">Semua Produk</option>
            {products.map((product) => (
              <option key={product.uuid} value={product.uuid}>{product.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, date_from: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, date_to: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          />
        </div>

        <div className="flex items-end lg:col-span-5">
          <button
            onClick={() => {
              setFilters({ from_branch_uuid: '', to_branch_uuid: '', product_uuid: '', date_from: '', date_to: '' });
              setCurrentPage(1);
            }}
            className="min-h-11 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      </div>
    ),
    [branches, products, filters.from_branch_uuid, filters.to_branch_uuid, filters.product_uuid, filters.date_from, filters.date_to]
  );

  const actionComponent = hasPermission('pos.stock-transfer.create') ? (
    <Link
      href="/app/pos/stock-transfers/create"
      className="inline-flex min-h-11 items-center gap-2 px-4 py-2 bg-[#EBC170] hover:bg-[#d4ab5f] rounded-lg text-gray-900 text-sm font-semibold transition-colors cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      Transfer Stok
    </Link>
  ) : undefined;

  const columns: Column<StockTransferHistoryDocument>[] = [
    {
      key: 'created_at',
      label: 'Waktu',
      sortable: true,
      width: '12rem',
      render: (_, row) => <span className="text-xs text-gray-700">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'reference_uuid',
      label: 'Dokumen',
      sortable: false,
      width: '10rem',
      render: (_, row) => (
        <span className="text-xs font-mono text-gray-700" title={row.reference_uuid}>
          {shortenUuid(row.reference_uuid)}
        </span>
      ),
    },
    {
      key: 'route',
      label: 'Rute',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <span>{row.from_branch?.name || '-'}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span>{row.to_branch?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Produk Ditransfer',
      sortable: false,
      render: (_, row) => {
        const names = row.items.map((item) => item.product?.name || '-');
        const preview = names.slice(0, 3);
        const remaining = names.length - preview.length;
        return (
          <div className="text-sm text-gray-700">
            <p>{preview.join(', ') || '-'}</p>
            {remaining > 0 && <p className="text-xs text-gray-500">+{remaining} produk lainnya</p>}
          </div>
        );
      },
    },
    {
      key: 'items_count',
      label: 'Total Produk',
      sortable: true,
      width: '7rem',
      render: (_, row) => <span className="text-sm font-semibold text-gray-900">{row.items_count}</span>,
    },
    {
      key: 'total_quantity',
      label: 'Total Qty',
      sortable: true,
      width: '7rem',
      render: (_, row) => <span className="text-sm font-semibold text-gray-900">{row.total_quantity}</span>,
    },
    {
      key: 'creator_name',
      label: 'User',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-700">{row.creator?.name || '-'}</span>,
    },
    {
      key: 'notes',
      label: 'Catatan',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-600">{row.notes || '-'}</span>,
    },
  ];

  // Tampilan kartu untuk layar kecil -- sebagai tabel 8 kolom, rute cabang &
  // total qty (dua hal yang paling ingin diketahui sekilas) tidak sama-sama
  // terlihat tanpa menggeser.
  const renderTransferCard = (row: StockTransferHistoryDocument) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <span className="truncate">{row.from_branch?.name || '-'}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{row.to_branch?.name || '-'}</span>
          </div>
          <p className="truncate text-xs text-gray-400">{formatDate(row.created_at)}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-gray-900">{row.total_quantity} pcs</span>
      </div>

      <p className="truncate text-xs text-gray-500">
        {row.items.map((item) => item.product?.name || '-').slice(0, 3).join(', ') || '-'}
        {row.items.length > 3 ? ` +${row.items.length - 3} lainnya` : ''}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
        <span>{row.items_count} produk</span>
        {row.creator?.name && <span>&middot; {row.creator.name}</span>}
      </div>

      {row.notes && <p className="truncate text-xs text-gray-500">{row.notes}</p>}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-[#142D52] flex items-center gap-2">
          <Shuffle className="h-6 w-6 shrink-0" />
          Transfer Stok
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Riwayat pindah stok fisik antar cabang.</p>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari produk, catatan, atau dokumen..."
        emptyMessage="Belum ada riwayat transfer stok"
        emptyIcon={<Shuffle className="w-16 h-16 text-gray-300 mx-auto" />}
        filterComponent={filterComponent}
        actionComponent={actionComponent}
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
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
          setCurrentPage(1);
        }}
        isLoading={isLoading}
        getRowId={(row) => row.reference_uuid}
        renderMobileCard={renderTransferCard}
      />
    </div>
  );
}
