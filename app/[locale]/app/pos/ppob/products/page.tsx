'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Package, Plus, RefreshCw, Pencil, Trash2, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useToast } from '@/components/toast/ToastContainer';
import { getPpobProductsList, deletePpobProduct, PpobProductLocal } from '@/lib/api/app/ppob';
import ProductFormModal from './_components/ProductFormModal';
import SyncModal from './_components/SyncModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

const CATEGORIES = ['PULSA', 'DATA', 'PLNPRA', 'PLNPASCA', 'TELKOM', 'PDAM', 'BPJS', 'EMONEY', 'GAME'];

export default function PpobProductsPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();

  const [products, setProducts] = useState<PpobProductLocal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [filterProvider, setFilterProvider] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editProduct, setEditProduct] = useState<PpobProductLocal | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PpobProductLocal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder, filterProvider, filterCategory]);

  useEffect(() => {
    setSelectedUuids((prev) => prev.filter((uuid) => products.some((p) => p.uuid === uuid)));
  }, [products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const result = await getPpobProductsList({
        page: currentPage,
        per_page: itemsPerPage,
        search: debouncedSearch || undefined,
        provider: filterProvider || undefined,
        category: filterCategory || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (result.status === 'success' && result.data) {
        const payload = Array.isArray(result.data)
          ? { data: result.data, pagination: undefined }
          : (result.data as { data?: PpobProductLocal[]; pagination?: { totalPages?: number; total?: number } });
        setProducts(payload.data || []);
        if (payload.pagination) {
          setTotalPages(payload.pagination.totalPages || 1);
          setTotalItems(payload.pagination.total || 0);
        }
      } else {
        toast.error(result.message || 'Gagal memuat produk PPOB');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat produk PPOB');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deletePpobProduct(deleteTarget.uuid);
      if (result.status === 'success') {
        toast.success('Produk PPOB berhasil dihapus');
        setShowDeleteModal(false);
        setDeleteTarget(null);
        fetchProducts();
      } else {
        toast.error(result.message || 'Gagal menghapus produk PPOB');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus produk PPOB');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedUuids.length) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/app/pos/ppob-products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuids: selectedUuids }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        toast.success('Produk PPOB berhasil dihapus');
        setSelectedUuids([]);
        setShowBulkDeleteModal(false);
        fetchProducts();
      } else {
        toast.error(result.message || 'Gagal menghapus produk PPOB');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus produk PPOB');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterProvider('');
    setFilterCategory('');
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(filterProvider || filterCategory);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const selectionState = useMemo(() => {
    const ids = products.map((p) => p.uuid);
    const selectedInPage = ids.filter((id) => selectedUuids.includes(id));
    const allSelected = ids.length > 0 && selectedInPage.length === ids.length;
    const isIndeterminate = selectedInPage.length > 0 && !allSelected;
    return { ids, allSelected, isIndeterminate };
  }, [products, selectedUuids]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectionState.isIndeterminate;
    }
  }, [selectionState.isIndeterminate]);

  const columns: Column<PpobProductLocal>[] = [
    {
      key: 'select',
      label: (
        <input
          ref={selectAllRef}
          type="checkbox"
          checked={selectionState.allSelected}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUuids((prev) => Array.from(new Set([...prev, ...selectionState.ids])));
            } else {
              setSelectedUuids((prev) => prev.filter((id) => !selectionState.ids.includes(id)));
            }
          }}
          className="cursor-pointer rounded border-gray-300"
        />
      ),
      sortable: false,
      width: '2.5rem',
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedUuids.includes(row.uuid)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUuids((prev) => Array.from(new Set([...prev, row.uuid])));
            } else {
              setSelectedUuids((prev) => prev.filter((id) => id !== row.uuid));
            }
          }}
          className="cursor-pointer rounded border-gray-300"
        />
      ),
    },
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '3rem',
      render: (_, row) => {
        const index = products.findIndex((p) => p.uuid === row.uuid);
        return <span className="text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</span>;
      },
    },
    {
      key: 'product_name',
      label: 'Produk',
      sortable: true,
      sortValue: (row) => row.product_name,
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.product_name}</p>
          <p className="text-xs text-gray-500">{row.provider_product_code}</p>
        </div>
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      sortable: true,
      sortValue: (row) => row.brand || '',
      width: '8rem',
      render: (_, row) => <span className="text-sm text-gray-700">{row.brand || '-'}</span>,
    },
    {
      key: 'provider',
      label: 'Provider',
      sortable: true,
      sortValue: (row) => row.provider,
      width: '8rem',
      render: (_, row) => (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            row.provider === 'rajabiller' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}
        >
          {row.provider_label || (row.provider === 'rajabiller' ? 'RajaBiller' : 'Digiflazz')}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      sortable: true,
      sortValue: (row) => row.category,
      width: '7rem',
      render: (_, row) => <span className="text-sm text-gray-700">{row.category}</span>,
    },
    {
      key: 'type',
      label: 'Tipe',
      sortable: false,
      width: '7rem',
      render: (_, row) => <span className="text-sm text-gray-700">{row.type === 'prepaid' ? 'Prabayar' : 'Pascabayar'}</span>,
    },
    {
      key: 'base_price',
      label: 'Harga Dasar',
      sortable: true,
      sortValue: (row) => row.base_price,
      width: '9rem',
      render: (_, row) => <span className="text-sm text-gray-700">{formatCurrency(Number(row.base_price))}</span>,
    },
    {
      key: 'selling_price',
      label: 'Harga Jual',
      sortable: true,
      sortValue: (row) => row.selling_price,
      width: '9rem',
      render: (_, row) => <span className="text-sm font-semibold text-gray-900">{formatCurrency(Number(row.selling_price))}</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: false,
      width: '6rem',
      render: (_, row) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      width: '6rem',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {hasPermission('admin.pos.ppob.create') && (
            <button
              onClick={() => {
                setEditProduct(row);
                setShowFormModal(true);
              }}
              className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
              title="Edit"
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </button>
          )}
          {hasPermission('admin.pos.ppob.create') && (
            <button
              onClick={() => {
                setDeleteTarget(row);
                setShowDeleteModal(true);
              }}
              className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-red-50"
              title="Hapus"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">Produk PPOB</h1>
          <p className="mt-1 text-gray-600">Kelola produk PPOB dan mapping provider.</p>
        </div>
        {hasPermission('admin.pos.ppob.create') && (
        <div className="flex items-center gap-2">
          {selectedUuids.length > 0 && hasPermission('admin.pos.ppob.create') && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex cursor-pointer items-center space-x-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              <span>Hapus ({selectedUuids.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowSyncModal(true)}
            className="flex cursor-pointer items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
              <RefreshCw className="h-4 w-4" />
              <span>Sync Provider</span>
            </button>
            <button
              onClick={() => {
                setEditProduct(null);
                setShowFormModal(true);
              }}
              className="flex cursor-pointer items-center space-x-2 rounded-lg bg-[#142D52] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#142D52]/90"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Produk</span>
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Filter Produk PPOB</h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex cursor-pointer items-center space-x-1 text-xs text-red-600 hover:text-red-700">
              <X className="h-3 w-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Provider</label>
            <select
              value={filterProvider}
              onChange={(e) => {
                setFilterProvider(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Provider</option>
              <option value="rajabiller">RajaBiller</option>
              <option value="digiflazz">Digiflazz</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        data={products}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari produk..."
        emptyMessage="Tidak ada produk PPOB ditemukan"
        emptyIcon={<Package className="mx-auto h-16 w-16 text-gray-300" />}
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

      {showFormModal && (
        <ProductFormModal
          product={editProduct}
          onClose={() => {
            setShowFormModal(false);
            setEditProduct(null);
          }}
          onSaved={() => {
            setShowFormModal(false);
            setEditProduct(null);
            fetchProducts();
          }}
        />
      )}

      {showSyncModal && <SyncModal onClose={() => setShowSyncModal(false)} onSynced={() => fetchProducts()} />}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (isDeleting) return;
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Produk PPOB"
        message={deleteTarget ? `Hapus produk "${deleteTarget.product_name}"?` : 'Hapus produk ini?'}
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => {
          if (isDeleting) return;
          setShowBulkDeleteModal(false);
        }}
        onConfirm={handleBulkDelete}
        title="Hapus Produk PPOB"
        message={`Hapus ${selectedUuids.length} produk PPOB?`}
        confirmText="Ya, Hapus"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
