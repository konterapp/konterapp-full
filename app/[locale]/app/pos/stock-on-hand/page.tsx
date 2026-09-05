'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';

interface BranchOption {
  uuid: string;
  name: string;
}

interface CategoryOption {
  uuid: string;
  name: string;
}

interface StockOnHandItem {
  uuid: string;
  stock: number;
  min_stock: number;
  stock_status: 'safe' | 'low' | 'out' | string;
  product: {
    uuid: string;
    name: string;
    sku: string;
    barcode?: string | null;
    unit?: string | null;
    category?: {
      uuid: string;
      name: string;
    } | null;
  } | null;
  branch: {
    uuid: string;
    name: string;
    code?: string | null;
  } | null;
  updated_at: string;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getStockStatusBadge = (status: string) => {
  if (status === 'out') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="w-3.5 h-3.5" />
        Habis
      </span>
    );
  }

  if (status === 'low') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <AlertTriangle className="w-3.5 h-3.5" />
        Menipis
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Aman
    </span>
  );
};

export default function StockOnHandPage() {
  const [rows, setRows] = useState<StockOnHandItem[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    branch_uuid: '',
    category_uuid: '',
    stock_status: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStockOnHand = useCallback(async (page: number) => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        per_page: String(itemsPerPage),
        search: debouncedSearch,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (filters.branch_uuid) params.append('branch_uuid', filters.branch_uuid);
      if (filters.category_uuid) params.append('category_uuid', filters.category_uuid);
      if (filters.stock_status) params.append('stock_status', filters.stock_status);

      const response = await fetch(`/api/app/pos/stock-on-hand?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setRows(result.data.data || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
        setBranches(result.data.filters?.branches || []);
        setCategories(result.data.filters?.categories || []);
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
  }, [debouncedSearch, filters.branch_uuid, filters.category_uuid, filters.stock_status, itemsPerPage, sortBy, sortOrder]);

  useEffect(() => {
    fetchStockOnHand(currentPage);
  }, [currentPage, fetchStockOnHand]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: 'branch_uuid' | 'category_uuid' | 'stock_status', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const filterComponent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
        <select
          value={filters.branch_uuid}
          onChange={(e) => handleFilterChange('branch_uuid', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
        <select
          value={filters.category_uuid}
          onChange={(e) => handleFilterChange('category_uuid', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
        >
          <option value="">Semua Kategori</option>
          {categories.map((category) => (
            <option key={category.uuid} value={category.uuid}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status Stok</label>
        <select
          value={filters.stock_status}
          onChange={(e) => handleFilterChange('stock_status', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
        >
          <option value="">Semua Status</option>
          <option value="in_stock">Ada Stok</option>
          <option value="out_stock">Habis</option>
        </select>
      </div>
    </div>
  );

  const columns: Column<StockOnHandItem>[] = [
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
      key: 'product_name',
      label: 'Produk',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.product?.name || '-'}</p>
          <p className="text-xs text-gray-500">Kode: {row.product?.sku || '-'}</p>
        </div>
      ),
    },
    {
      key: 'category_name',
      label: 'Kategori',
      sortable: false,
      render: (_, row) => <p className="text-sm text-gray-700">{row.product?.category?.name || '-'}</p>,
    },
    {
      key: 'branch_name',
      label: 'Cabang',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="text-sm text-gray-900">{row.branch?.name || '-'}</p>
          <p className="text-xs text-gray-500">{row.branch?.code || '-'}</p>
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stok Saat Ini',
      sortable: true,
      width: '9rem',
      render: (_, row) => (
        <p className="text-sm font-semibold text-gray-900">
          {row.stock} <span className="font-normal text-gray-500">{row.product?.unit || ''}</span>
        </p>
      ),
    },
    {
      key: 'min_stock',
      label: 'Min Stok',
      sortable: true,
      width: '8rem',
      render: (_, row) => <p className="text-sm text-gray-700">{row.min_stock}</p>,
    },
    {
      key: 'stock_status',
      label: 'Status',
      sortable: false,
      width: '9rem',
      render: (_, row) => getStockStatusBadge(row.stock_status),
    },
    {
      key: 'updated_at',
      label: 'Update Terakhir',
      sortable: true,
      width: '12rem',
      render: (_, row) => <p className="text-xs text-gray-600">{formatDate(row.updated_at)}</p>,
    },
  ];

  // Tampilan kartu untuk layar kecil -- sebagai tabel 8 kolom, kolom
  // Kategori, Min Stok, dan Update Terakhir tidak terlihat sama sekali.
  const renderStockCard = (row: StockOnHandItem) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        {/* min-w-0 wajib: tanpa itu flex child menolak menyusut & nama
            produk yang panjang bikin overflow horizontal. */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{row.product?.name || '-'}</p>
          <p className="truncate text-xs text-gray-500">
            {row.product?.sku || '-'}
            {row.product?.category?.name ? ` · ${row.product.category.name}` : ''}
          </p>
        </div>
        <div className="shrink-0">{getStockStatusBadge(row.stock_status)}</div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-gray-500">
          {row.branch?.name || '-'}
          {row.branch?.code ? ` (${row.branch.code})` : ''}
        </p>
        <p className="shrink-0 text-sm font-semibold text-gray-900">
          {row.stock} <span className="font-normal text-gray-500">{row.product?.unit || ''}</span>
          <span className="ml-1 font-normal text-gray-400">/ min {row.min_stock}</span>
        </p>
      </div>

      <p className="text-[11px] text-gray-400">Update terakhir: {formatDate(row.updated_at)}</p>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-2xl font-bold text-[#142D52]">Stock On-Hand</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Snapshot saldo stok terkini per produk dan cabang.</p>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari produk, kode produk, barcode, atau cabang..."
        emptyMessage="Tidak ada data stok ditemukan"
        emptyIcon={<Archive className="w-16 h-16 text-gray-300 mx-auto" />}
        filterComponent={filterComponent}
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
        renderMobileCard={renderStockCard}
      />
    </div>
  );
}
