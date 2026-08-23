'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { UsersRound, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useUser } from '@/app/[locale]/app/_context/UserContext';

interface UserRow {
  id: number;
  uuid: string;
  name: string;
  email: string;
  is_active: boolean;
  email_verified_at?: string | null;
  invitation_accepted_at?: string | null;
  roles: { uuid: string; name: string }[];
  created_at?: string;
  updated_at?: string;
}

export default function UsersPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<UserRow[]>([]);
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: UserRow | null; isLoading: boolean }>({
    isOpen: false,
    user: null,
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
    fetchUsers(currentPage);
  }, [currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const fetchUsers = async (page: number) => {
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

      const response = await fetch(`/api/app/users?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setUsers(result.data.data || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
      } else {
        setError(result.message || 'Gagal memuat data user');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (user: UserRow) => {
    setDeleteModal({
      isOpen: true,
      user,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/app/users/${deleteModal.user.uuid}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('User berhasil dihapus dari perusahaan');
        setDeleteModal({ isOpen: false, user: null, isLoading: false });
        fetchUsers(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus user');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, user: null, isLoading: false });
  };

  const isSelf = (row: UserRow) => currentUser?.id === row.id;

  const columns: Column<UserRow>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = users.findIndex(u => u.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      width: '16rem',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{row.name}</p>
          {isSelf(row) && (
            <span className="inline-flex items-center px-2 py-0.5 bg-[#EBC170] text-gray-900 rounded-full text-xs font-medium">
              Anda
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      sortValue: (row) => row.email.toLowerCase(),
      render: (_, row) => (
        <p className="text-sm text-gray-600">{row.email}</p>
      ),
    },
    {
      key: 'email_verified',
      label: 'Verifikasi Email',
      sortable: false,
      render: (_, row) => (
        row.email_verified_at ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Terverifikasi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
            </svg>
            Belum
          </span>
        )
      ),
    },
    {
      key: 'invitation_accepted',
      label: 'Undangan',
      sortable: false,
      render: (_, row) => (
        row.invitation_accepted_at ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Diterima
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
            </svg>
            Menunggu
          </span>
        )
      ),
    },
    {
      key: 'roles',
      label: 'Role',
      sortable: false,
      render: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map(role => (
            <span
              key={role.uuid}
              className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
            >
              {role.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (_, row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            row.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {row.is_active ? 'Aktif' : 'Nonaktif'}
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
          {hasPermission('user.update') && (
            <Link
              href={`/app/users/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {hasPermission('user.delete') && !isSelf(row) && (
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
          <h1 className="text-2xl font-bold text-[#142D52]">Manajemen User</h1>
          <p className="text-gray-600 mt-1">Kelola user dan role-nya untuk perusahaan ini.</p>
        </div>
        {hasPermission('user.create') && (
          <Link
            href="/app/users/create"
            className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah User</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={users}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari user..."
        emptyMessage="Tidak ada user ditemukan"
        emptyIcon={<UsersRound className="w-16 h-16 text-gray-300 mx-auto" />}
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
        title="Hapus User"
        message={`Apakah Anda yakin ingin menghapus user "${deleteModal.user?.name || ''}" dari perusahaan ini? User akan kehilangan akses ke perusahaan ini.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
