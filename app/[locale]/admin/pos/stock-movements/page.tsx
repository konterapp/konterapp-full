'use client';

import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';

interface BranchOption {
  uuid: string;
  name: string;
}

interface ProductOption {
  uuid: string;
  name: string;
}

interface StockMovement {
  uuid: string;
  created_at: string;
  movement_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  notes: string | null;
  product?: {
    uuid: string;
    name: string;
    sku?: string | null;
  } | null;
  branch?: {
    uuid: string;
    name: string;
  } | null;
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

export default function StockMovementsPage() {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [filters, setFilters] = useState({
    search: '',
    branch_uuid: '',
    product_uuid: '',
    movement_type: '',
    date_from: '',
    date_to: '',
  });

  useEffect(() => {
    loadBranches();
    loadProducts();
  }, []);

  useEffect(() => {
    fetchStockMovements(currentPage);
  }, [currentPage, itemsPerPage, filters, sortBy, sortOrder]);

  const loadBranches = async () => {
    try {
      const response = await fetch('/api/admin/pos/branches/list');
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        setBranches(result.data);
      }
    } catch {
      setBranches([]);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/admin/pos/products?per_page=1000');
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const items = result.data.data || result.data || [];
        setProducts(items);
      }
    } catch {
      setProducts([]);
    }
  };

  const fetchStockMovements = async (page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
        search: filters.search,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (filters.branch_uuid) params.append('branch_uuid', filters.branch_uuid);
      if (filters.product_uuid) params.append('product_uuid', filters.product_uuid);
      if (filters.movement_type) params.append('movement_type', filters.movement_type);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/admin/pos/stock-movements?${params}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setStockMovements(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        }
      }
    } catch {
      setStockMovements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters({
      search: '',
      branch_uuid: '',
      product_uuid: '',
      movement_type: '',
      date_from: '',
      date_to: '',
    });
    setCurrentPage(1);
  };

  const getMovementTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      purchase: { color: 'bg-blue-100 text-blue-800', label: 'Pembelian' },
      sale: { color: 'bg-green-100 text-green-800', label: 'Penjualan' },
      adjustment: { color: 'bg-yellow-100 text-yellow-800', label: 'Penyesuaian' },
      transfer_in: { color: 'bg-purple-100 text-purple-800', label: 'Transfer Masuk' },
      transfer_out: { color: 'bg-red-100 text-red-800', label: 'Transfer Keluar' },
      in: { color: 'bg-green-100 text-green-800', label: 'Masuk' },
      out: { color: 'bg-red-100 text-red-800', label: 'Keluar' },
    };

    const config = badges[type] || { color: 'bg-gray-100 text-gray-800', label: type || '-' };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const columns: Column<StockMovement>[] = [
    {
      key: 'created_at',
      label: 'Tanggal',
      sortable: true,
      render: (_, movement) => formatDate(movement.created_at),
    },
    {
      key: 'product_name',
      label: 'Produk',
      sortable: true,
      render: (_, movement) => movement.product?.name || '-',
    },
    {
      key: 'branch_name',
      label: 'Cabang',
      sortable: true,
      render: (_, movement) => movement.branch?.name || '-',
    },
    {
      key: 'movement_type',
      label: 'Tipe',
      sortable: true,
      render: (_, movement) => getMovementTypeBadge(movement.movement_type),
    },
    {
      key: 'quantity_change',
      label: 'Perubahan',
      sortable: true,
      render: (_, movement) => (
        <span className={movement.quantity_change > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
        </span>
      ),
    },
    {
      key: 'quantity_before',
      label: 'Stok Sebelum',
      sortable: true,
      render: (_, movement) => (
        <span className="text-sm text-gray-700">{movement.quantity_before}</span>
      ),
    },
    {
      key: 'quantity_after',
      label: 'Stok Sesudah',
      sortable: true,
      render: (_, movement) => (
        <span className="text-sm text-gray-700">{movement.quantity_after}</span>
      ),
    },
    {
      key: 'reference_type',
      label: 'Referensi',
      sortable: false,
      render: (_, movement) => (
        <div className="text-sm">
          {movement.reference_type && (
            <div className="font-medium">{movement.reference_type}</div>
          )}
          {movement.notes && (
            <div className="text-gray-500 text-xs">{movement.notes}</div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52] flex items-center gap-2">
            <History className="h-6 w-6" />
            Riwayat Pergerakan Stok
          </h1>
          <p className="text-gray-600 mt-1">Audit trail semua perubahan stok produk</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
            <select
              value={filters.branch_uuid}
              onChange={(e) => handleFilterChange('branch_uuid', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
            <select
              value={filters.product_uuid}
              onChange={(e) => handleFilterChange('product_uuid', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Produk</option>
              {products.map((product) => (
                <option key={product.uuid} value={product.uuid}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pergerakan</label>
            <select
              value={filters.movement_type}
              onChange={(e) => handleFilterChange('movement_type', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Tipe</option>
              <option value="purchase">Pembelian</option>
              <option value="sale">Penjualan</option>
              <option value="adjustment">Penyesuaian</option>
              <option value="transfer_in">Transfer Masuk</option>
              <option value="transfer_out">Transfer Keluar</option>
              <option value="in">Masuk</option>
              <option value="out">Keluar</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          columns={columns}
          data={stockMovements}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          onSortChange={handleSortChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          serverSide={true}
          searchPlaceholder="Cari produk..."
          searchQuery={filters.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
        />
      </div>
    </div>
  );
}
