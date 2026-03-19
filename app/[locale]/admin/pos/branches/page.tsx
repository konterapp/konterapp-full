'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import ConfirmModal from '../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';

interface Branch {
  uuid: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_main: boolean;
}

export default function BranchesPage() {
  const toast = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; branch: Branch | null; isLoading: boolean }>({
    isOpen: false,
    branch: null,
    isLoading: false,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBranches = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
        search: debouncedSearch,
      });
      
      const response = await fetch(`/api/admin/pos/branches?${params}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setBranches(result.data.data);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        }
      } else {
        setError(result.message || 'Gagal memuat data cabang');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, debouncedSearch]);

  useEffect(() => {
    fetchBranches(currentPage);
  }, [currentPage, fetchBranches]);

  const handleDeleteClick = (branch: Branch) => {
    setDeleteModal({
      isOpen: true,
      branch,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.branch) return;
    
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch(`/api/admin/pos/branches/${deleteModal.branch.uuid}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success('Cabang berhasil dihapus');
        setDeleteModal({ isOpen: false, branch: null, isLoading: false });
        fetchBranches(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus cabang');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      toast.error('Gagal menghapus cabang. Silakan coba lagi.');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, branch: null, isLoading: false });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const columns: Column<Branch>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = branches.findIndex(b => b.uuid === row.uuid);
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{row.code}</span>
          {row.is_main && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Utama
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Nama Cabang',
      sortable: true,
      sortValue: (row) => row.name,
      width: '20rem',
      render: (_, row) => (
        <span className="text-sm text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'address',
      label: 'Alamat',
      sortable: false,
      width: '25rem',
      render: (_, row) => (
        <span className="text-sm text-gray-600 truncate max-w-xs block">{row.address || '-'}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Kontak',
      sortable: false,
      width: '12rem',
      render: (_, row) => (
        <div className="space-y-1">
          {row.phone && (
            <div className="text-sm text-gray-600">{row.phone}</div>
          )}
          {row.email && (
            <div className="text-xs text-gray-500">{row.email}</div>
          )}
          {!row.phone && !row.email && <span className="text-sm text-gray-400">-</span>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortValue: (row) => row.is_active ? 'Active' : 'Inactive',
      width: '8rem',
      render: (_, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {row.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      width: '8rem',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/pos/branches/${row.uuid}/edit`}
            className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
          </Link>
          <button
            type="button"
            onClick={() => handleDeleteClick(row)}
            className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Hapus</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">Manajemen Cabang</h1>
          <p className="text-gray-600 mt-1">Kelola data cabang/lokasi toko Anda</p>
        </div>
        <Link
          href="/admin/pos/branches/create"
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors cursor-pointer font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Cabang</span>
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={branches}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari cabang..."
        emptyMessage="Belum ada data cabang"
        emptyIcon={<Building2 className="w-16 h-16 text-gray-300 mx-auto" />}
        serverSide={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy="code"
        sortOrder="asc"
        onSortChange={() => {}}
        isLoading={isLoading}
        getRowId={(row) => row.uuid}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Cabang"
        message={`Apakah Anda yakin ingin menghapus cabang "${deleteModal.branch?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
