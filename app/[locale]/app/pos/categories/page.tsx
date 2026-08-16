'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Tag, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import ConfirmModal from '../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Category {
  uuid: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export default function CategoriesPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; category: Category | null; isLoading: boolean }>({
    isOpen: false,
    category: null,
    isLoading: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories(currentPage);
  }, [currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const fetchCategories = async (page: number) => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (sortBy) {
        params.append('sort_by', sortBy);
      }

      if (sortOrder) {
        params.append('sort_order', sortOrder);
      }

      const response = await fetch(`/api/app/pos/categories?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setCategories(result.data.data || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
      } else {
        setError(result.message || 'Gagal memuat data kategori');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteModal({
      isOpen: true,
      category,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.category) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/app/pos/categories/${deleteModal.category.uuid}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Kategori berhasil dihapus');
        setDeleteModal({ isOpen: false, category: null, isLoading: false });
        fetchCategories(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus kategori');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, category: null, isLoading: false });
  };

  const columns: Column<Category>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = categories.findIndex(c => c.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'name',
      label: 'Nama Kategori',
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      width: '20rem',
      render: (_, row) => (
        <p className="text-sm font-medium text-gray-900">{row.name}</p>
      ),
    },
    {
      key: 'description',
      label: 'Deskripsi',
      sortable: false,
      render: (_, row) => (
        <p className="text-sm text-gray-600">
          {row.description || <span className="text-gray-400">-</span>}
        </p>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {hasPermission('admin.pos.category.update') && (
            <Link
              href={`/app/pos/categories/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {hasPermission('admin.pos.category.delete') && (
            <button
              onClick={() => handleDeleteClick(row)}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Hapus</span>
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
          <h1 className="text-2xl font-bold text-[#142D52]">Kategori Produk</h1>
          <p className="text-gray-600 mt-1">Kelola kategori produk untuk sistem POS.</p>
        </div>
        {hasPermission('admin.pos.category.create') && (
          <Link
            href="/app/pos/categories/create"
            className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Kategori</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={categories}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari kategori..."
        emptyMessage="Tidak ada kategori ditemukan"
        emptyIcon={<Tag className="w-16 h-16 text-gray-300 mx-auto" />}
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

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteModal.category?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
