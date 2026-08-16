'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Shield, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import DataTable, { Column } from '../_components/DataTable';
import { getRoles, deleteRole, Role } from '@/lib/api/app/role';
import ConfirmModal from '../_components/ConfirmModal';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useToast } from '@/components/toast/ToastContainer';

export default function RolesPage() {
   const { hasPermission } = usePermissions();
   const toast = useToast();
   const [roles, setRoles] = useState<Role[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const [totalItems, setTotalItems] = useState(0);
   const [itemsPerPage, setItemsPerPage] = useState(10);
   const [searchQuery, setSearchQuery] = useState('');
   const [debouncedSearch, setDebouncedSearch] = useState('');
   const [sortBy, setSortBy] = useState('id');
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
   const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; role: Role | null; isLoading: boolean }>({
      isOpen: false,
      role: null,
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

   const fetchRoles = useCallback(async (page: number) => {
      try {
         setIsLoading(true);
         setError('');
         const response = await getRoles(page, itemsPerPage, debouncedSearch, sortBy, sortOrder);

         if (response.data) {
            setRoles(response.data.data);
            if (response.data.meta) {
               setTotalPages(response.data.meta.last_page);
               setTotalItems(response.data.meta.total);
            }
         } else if (response.status === 'error') {
            setError(response.message || 'Gagal memuat daftar role');
         }
      } catch {
         setError('Terjadi kesalahan saat memuat data');
      } finally {
         setIsLoading(false);
      }
   }, [itemsPerPage, debouncedSearch, sortBy, sortOrder]);

   useEffect(() => {
      fetchRoles(currentPage);
   }, [currentPage, fetchRoles]);

   const handleSortChange = (field: string, order: 'asc' | 'desc') => {
      setSortBy(field);
      setSortOrder(order);
      setCurrentPage(1);
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
         const response = await deleteRole(deleteModal.role.id);

         if (response.status === 'success') {
            toast.success(response.message || 'Role berhasil dihapus');
            setDeleteModal({ isOpen: false, role: null, isLoading: false });
            fetchRoles(currentPage);
         } else {
            toast.error(response.message || 'Gagal menghapus role');
            setDeleteModal(prev => ({ ...prev, isLoading: false }));
         }
      } catch {
         toast.error('Terjadi kesalahan, silakan coba lagi');
         setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
   };

   const handleDeleteCancel = () => {
      setDeleteModal({ isOpen: false, role: null, isLoading: false });
   };

   // Define columns
   const columns: Column<Role>[] = [
      {
         key: 'no',
         label: 'No',
         sortable: false,
         width: '4rem',
         render: (_, row) => {
            const index = roles.findIndex(r => r.id === row.id);
            const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
            return <span className="text-sm text-gray-600">{rowNumber}</span>;
         },
      },
      {
         key: 'name',
         label: 'Nama Role',
         sortable: true,
         sortValue: (row) => row.name.toLowerCase(),
         render: (_, row) => (
            <p className="text-sm font-medium text-gray-900">{row.name}</p>
         ),
      },
      {
         key: 'permissions',
         label: 'Permissions',
         sortable: false,
         width: '10rem',
         render: (_, row) => (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
               {row.permissions && row.permissions.length > 0
                  ? `${row.permissions.length} permissions`
                  : '-'}
            </span>
         ),
      },
      {
         key: 'users_count',
         label: 'Pengguna',
         sortable: false,
         width: '8rem',
         render: (_, row) => (
            <span className="text-sm text-gray-600">
               {row.users_count !== undefined ? row.users_count : 0} user
            </span>
         ),
      },
      {
         key: 'actions',
         label: 'Actions',
         sortable: false,
         className: 'whitespace-nowrap',
         render: (_, row) => {
            const canEdit = hasPermission('admin.role.update');
            const canDelete = hasPermission('admin.role.delete');

            return (
               <div className="flex items-center gap-2">
                  <Link
                     href={`/app/roles/${row.id}`}
                     className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
                  >
                     <Eye className="w-3.5 h-3.5" />
                     <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Detail</span>
                  </Link>
                  {canEdit && (
                     <Link
                        href={`/app/roles/${row.id}/edit`}
                        className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
                     >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
                     </Link>
                  )}
                  {canDelete && (
                     <button
                        onClick={() => handleDeleteClick(row)}
                        className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
                     >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Hapus</span>
                     </button>
                  )}
               </div>
            );
         },
      },
   ];

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold text-gray-900">Daftar Role</h1>
               <p className="text-gray-600 mt-1">Kelola role dan permission pengguna</p>
            </div>
            <div className="flex items-center gap-2">
               {hasPermission('admin.role.create') && (
                  <Link
                     href="/app/roles/create"
                     className="flex items-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors font-semibold"
                  >
                     <Plus className="w-5 h-5" />
                     <span>Tambah Role</span>
                  </Link>
               )}
            </div>
         </div>

         {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
               {error}
            </div>
         )}

         <DataTable
            data={roles}
            columns={columns}
            itemsPerPage={itemsPerPage}
            searchPlaceholder="Cari role..."
            emptyMessage="Belum ada role yang ditambahkan"
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
