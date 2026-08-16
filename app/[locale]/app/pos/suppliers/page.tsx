'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import ConfirmModal from '../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Supplier {
  uuid: string;
  code: string;
  name: string;
  contact_person?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  is_active: boolean;
}

export default function SuppliersPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; supplier: Supplier | null; isLoading: boolean }>({
    isOpen: false,
    supplier: null,
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
    fetchSuppliers(currentPage);
  }, [currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  const fetchSuppliers = async (page: number) => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
        search: debouncedSearch,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/app/pos/suppliers?${params}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setSuppliers(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        }
      } else if (result.status === 'error') {
        setError(result.message || 'Gagal memuat data supplier');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setDeleteModal({ isOpen: true, supplier, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.supplier) return;

    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/app/pos/suppliers/${deleteModal.supplier.uuid}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Supplier berhasil dihapus');
        setDeleteModal({ isOpen: false, supplier: null, isLoading: false });
        fetchSuppliers(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus supplier');
        setDeleteModal((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, supplier: null, isLoading: false });
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = suppliers.findIndex((supplier) => supplier.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'code',
      label: 'Kode',
      sortable: true,
      sortValue: (row) => row.code,
      width: '10rem',
      render: (_, row) => (
        <p className="text-sm font-medium text-gray-900">{row.code}</p>
      ),
    },
    {
      key: 'name',
      label: 'Nama Supplier',
      sortable: true,
      sortValue: (row) => row.name,
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.name}</p>
          {row.contact_person && (
            <p className="text-xs text-gray-500">CP: {row.contact_person}</p>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Telepon',
      sortable: false,
      width: '12rem',
      render: (_, row) => (
        <p className="text-sm text-gray-600">{row.phone}</p>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: false,
      width: '14rem',
      render: (_, row) => (
        <p className="text-sm text-gray-600">{row.email || '-'}</p>
      ),
    },
    {
      key: 'address',
      label: 'Alamat',
      sortable: false,
      render: (_, row) => (
        <p className="text-sm text-gray-600 line-clamp-2">{row.address || '-'}</p>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: false,
      width: '8rem',
      render: (_, row) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          row.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.is_active ? 'Aktif' : 'Non-aktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {hasPermission('admin.pos.supplier.update') && (
            <Link
              href={`/app/pos/suppliers/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {hasPermission('admin.pos.supplier.delete') && (
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
          <h1 className="text-2xl font-bold text-[#142D52]">Supplier</h1>
          <p className="text-gray-600 mt-1">Kelola data supplier produk Anda</p>
        </div>
        {hasPermission('admin.pos.supplier.create') && (
          <Link
            href="/app/pos/suppliers/create"
            className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors cursor-pointer font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Supplier</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          columns={columns}
          data={suppliers}
          isLoading={isLoading}
          serverSide={true}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          searchQuery={searchQuery}
          searchPlaceholder="Cari supplier (nama, kode, telepon, email)..."
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          onSearchChange={setSearchQuery}
          onSortChange={handleSortChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          getRowId={(row) => row.uuid}
        />
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        title="Hapus Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${deleteModal.supplier?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
