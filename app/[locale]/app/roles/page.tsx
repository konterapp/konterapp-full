'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Shield, Plus, Edit, Trash2, ShieldCheck, Lock } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Role {
  uuid: string;
  name: string;
  is_full_access: boolean;
  permissions: string[];
  user_count: number;
  created_at?: string;
  updated_at?: string;
}

const ADMINISTRATOR_ROLE = 'administrator';

export default function RolesPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; role: Role | null; isLoading: boolean }>({
    isOpen: false,
    role: null,
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
    fetchRoles(currentPage);
  }, [currentPage, itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const fetchRoles = async (page: number) => {
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

      const response = await fetch(`/api/app/roles?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setRoles(result.data.data || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
      } else {
        setError(result.message || 'Gagal memuat data role');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (role: Role) => {
    setDeleteModal({
      isOpen: true,
      role,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.role) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/app/roles/${deleteModal.role.uuid}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Role berhasil dihapus');
        setDeleteModal({ isOpen: false, role: null, isLoading: false });
        fetchRoles(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus role');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, role: null, isLoading: false });
  };

  const isProtectedRole = (role: Role) => role.name === ADMINISTRATOR_ROLE;

  const columns: Column<Role>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = roles.findIndex(r => r.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {!isProtectedRole(row) && hasPermission('role.update') && (
            <Link
              href={`/app/roles/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {!isProtectedRole(row) && hasPermission('role.delete') && (
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
    {
      key: 'name',
      label: 'Nama Role',
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      width: '20rem',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900">{row.name}</p>
          {isProtectedRole(row) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              <Lock className="w-3 h-3" />
              Default
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'access',
      label: 'Akses',
      sortable: false,
      render: (_, row) => (
        row.is_full_access ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFF7E6] text-[#B8860B] rounded-full text-xs font-medium">
            <ShieldCheck className="w-3 h-3" />
            Akses Penuh
          </span>
        ) : (
          <span className="text-sm text-gray-600">
            {row.permissions.length} izin
          </span>
        )
      ),
    },
    {
      key: 'user_count',
      label: 'Jumlah User',
      sortable: true,
      sortValue: (row) => row.user_count,
      render: (_, row) => (
        <span className="text-sm text-gray-600">{row.user_count} user</span>
      ),
    },
  ];

  // Tampilan kartu untuk layar kecil -- sebagai tabel 5 kolom, kolom Akses &
  // Jumlah User tidak terlihat sama sekali dan aksinya cuma ikon bertooltip
  // yang tidak pernah muncul di layar sentuh.
  const renderRoleCard = (row: Role) => (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        {/* min-w-0 wajib: tanpa itu flex child menolak menyusut & nama role
            yang panjang bikin overflow horizontal. */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-gray-900">{row.name}</p>
            {isProtectedRole(row) && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                <Lock className="w-3 h-3" />
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{row.user_count} user</p>
        </div>
        <div className="shrink-0">
          {row.is_full_access ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7E6] px-2 py-0.5 text-xs font-medium text-[#B8860B]">
              <ShieldCheck className="w-3 h-3" />
              Akses Penuh
            </span>
          ) : (
            <span className="text-xs text-gray-500">{row.permissions.length} izin</span>
          )}
        </div>
      </div>

      {!isProtectedRole(row) && (hasPermission('role.update') || hasPermission('role.delete')) && (
        <div className="flex items-center gap-2 border-t border-gray-100 pt-2.5">
          {hasPermission('role.update') && (
            <Link
              href={`/app/roles/${row.uuid}/edit`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#EBC170] px-2 text-xs font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer"
            >
              Edit
            </Link>
          )}
          {hasPermission('role.delete') && (
            <button
              type="button"
              onClick={() => handleDeleteClick(row)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-red-500 px-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile: judul & tombol ditumpuk. Sebelumnya dipaksa sebaris sehingga
          label "Tambah Role" pecah dua baris dan menghimpit judul. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-[#142D52]">Manajemen Role</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola role dan izin akses user untuk perusahaan ini.</p>
        </div>
        {hasPermission('role.create') && (
          <Link
            href="/app/roles/create"
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>Tambah Role</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={roles}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari role..."
        emptyMessage="Tidak ada role ditemukan"
        emptyIcon={<Shield className="w-16 h-16 text-gray-300 mx-auto" />}
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
        renderMobileCard={renderRoleCard}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Role"
        message={`Apakah Anda yakin ingin menghapus role "${deleteModal.role?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
