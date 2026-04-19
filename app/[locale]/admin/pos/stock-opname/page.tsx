'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClipboardCheck, History, Plus } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';

interface BranchOption {
  uuid: string;
  name: string;
}

interface ProductOption {
  uuid: string;
  name: string;
}

interface StockOpnameHistoryItem {
  uuid: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  product?: {
    uuid: string;
    name: string;
    sku?: string | null;
  } | null;
}

interface StockOpnameHistoryDocument {
  reference_uuid: string;
  created_at: string;
  notes: string | null;
  items_count: number;
  total_adjustment: number;
  branch?: {
    uuid: string;
    name: string;
  } | null;
  creator?: {
    id: number;
    name: string;
    email: string;
  } | null;
  items: StockOpnameHistoryItem[];
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function shortenUuid(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

export default function StockOpnamePage() {
  const [historyRows, setHistoryRows] = useState<StockOpnameHistoryDocument[]>([]);
  const [historyBranches, setHistoryBranches] = useState<BranchOption[]>([]);
  const [historyProducts, setHistoryProducts] = useState<ProductOption[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalItems, setHistoryTotalItems] = useState(0);
  const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState('');
  const [historySortBy, setHistorySortBy] = useState('created_at');
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('desc');
  const [historyFilters, setHistoryFilters] = useState({
    branch_uuid: '',
    product_uuid: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHistorySearch(historySearchQuery);
      setHistoryCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [historySearchQuery]);

  const fetchOpnameHistory = useCallback(
    async (page: number) => {
      try {
        setHistoryLoading(true);

        const params = new URLSearchParams({
          scope: 'history',
          page: String(page),
          per_page: String(historyItemsPerPage),
          search: debouncedHistorySearch,
          sort_by: historySortBy,
          sort_order: historySortOrder,
        });

        if (historyFilters.branch_uuid) params.append('branch_uuid', historyFilters.branch_uuid);
        if (historyFilters.product_uuid) params.append('product_uuid', historyFilters.product_uuid);
        if (historyFilters.date_from) params.append('date_from', historyFilters.date_from);
        if (historyFilters.date_to) params.append('date_to', historyFilters.date_to);

        const response = await fetch(`/api/admin/pos/stock-opname?${params.toString()}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          setHistoryRows(result.data.data || []);
          setHistoryTotalPages(result.data.pagination?.totalPages || 1);
          setHistoryTotalItems(result.data.pagination?.total || 0);
          setHistoryBranches(result.data.filters?.branches || []);
          setHistoryProducts(result.data.filters?.products || []);
        } else {
          setHistoryRows([]);
          setHistoryTotalPages(1);
          setHistoryTotalItems(0);
        }
      } catch {
        setHistoryRows([]);
        setHistoryTotalPages(1);
        setHistoryTotalItems(0);
      } finally {
        setHistoryLoading(false);
      }
    },
    [
      historyItemsPerPage,
      debouncedHistorySearch,
      historySortBy,
      historySortOrder,
      historyFilters.branch_uuid,
      historyFilters.product_uuid,
      historyFilters.date_from,
      historyFilters.date_to,
    ]
  );

  useEffect(() => {
    fetchOpnameHistory(historyCurrentPage);
  }, [historyCurrentPage, fetchOpnameHistory]);

  const historyFilterComponent = useMemo(
    () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
          <select
            value={historyFilters.branch_uuid}
            onChange={(e) => {
              setHistoryFilters((prev) => ({ ...prev, branch_uuid: e.target.value }));
              setHistoryCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          >
            <option value="">Semua Cabang</option>
            {historyBranches.map((branch) => (
              <option key={branch.uuid} value={branch.uuid}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
          <select
            value={historyFilters.product_uuid}
            onChange={(e) => {
              setHistoryFilters((prev) => ({ ...prev, product_uuid: e.target.value }));
              setHistoryCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          >
            <option value="">Semua Produk</option>
            {historyProducts.map((product) => (
              <option key={product.uuid} value={product.uuid}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={historyFilters.date_from}
            onChange={(e) => {
              setHistoryFilters((prev) => ({ ...prev, date_from: e.target.value }));
              setHistoryCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={historyFilters.date_to}
            onChange={(e) => {
              setHistoryFilters((prev) => ({ ...prev, date_to: e.target.value }));
              setHistoryCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setHistoryFilters({
                branch_uuid: '',
                product_uuid: '',
                date_from: '',
                date_to: '',
              });
              setHistoryCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      </div>
    ),
    [historyBranches, historyProducts, historyFilters.branch_uuid, historyFilters.product_uuid, historyFilters.date_from, historyFilters.date_to]
  );

  const historyActionComponent = (
    <Link
      href="/admin/pos/stock-opname/create"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#EBC170] hover:bg-[#d4ab5f] rounded-lg text-gray-900 text-sm font-semibold transition-colors cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      Buat Stok Opname
    </Link>
  );

  const historyColumns: Column<StockOpnameHistoryDocument>[] = [
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
      key: 'branch_name',
      label: 'Cabang',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-700">{row.branch?.name || '-'}</span>,
    },
    {
      key: 'items',
      label: 'Produk Diopname',
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
      key: 'total_adjustment',
      label: 'Total Selisih',
      sortable: true,
      width: '8rem',
      render: (_, row) => (
        <span className={row.total_adjustment > 0 ? 'text-green-600 font-semibold' : row.total_adjustment < 0 ? 'text-red-600 font-semibold' : 'text-gray-700 font-semibold'}>
          {row.total_adjustment > 0 ? '+' : ''}
          {row.total_adjustment}
        </span>
      ),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52] flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6" />
          Stok Opname
        </h1>
        <p className="text-gray-600 mt-1">Riwayat dokumen stok opname. Satu dokumen dapat memuat banyak produk.</p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#142D52] flex items-center gap-2 mb-3">
          <History className="w-5 h-5" />
          Riwayat Stok Opname
        </h2>
        <DataTable
          data={historyRows}
          columns={historyColumns}
          itemsPerPage={historyItemsPerPage}
          searchPlaceholder="Cari produk, SKU, catatan, atau UUID dokumen..."
          emptyMessage="Belum ada riwayat stok opname"
          emptyIcon={<History className="w-16 h-16 text-gray-300 mx-auto" />}
          filterComponent={historyFilterComponent}
          actionComponent={historyActionComponent}
          serverSide={true}
          currentPage={historyCurrentPage}
          totalPages={historyTotalPages}
          totalItems={historyTotalItems}
          onPageChange={setHistoryCurrentPage}
          onItemsPerPageChange={setHistoryItemsPerPage}
          searchQuery={historySearchQuery}
          onSearchChange={setHistorySearchQuery}
          sortBy={historySortBy}
          sortOrder={historySortOrder}
          onSortChange={(field, order) => {
            setHistorySortBy(field);
            setHistorySortOrder(order);
            setHistoryCurrentPage(1);
          }}
          isLoading={historyLoading}
          getRowId={(row) => row.reference_uuid}
        />
      </div>
    </div>
  );
}
