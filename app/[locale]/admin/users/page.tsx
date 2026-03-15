'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Users, Plus, Edit, Trash2, User as UserIcon, ToggleLeft, ToggleRight, LogIn } from 'lucide-react';
import Image from '@/components/ui/Image';
import DataTable, { Column } from '../_components/DataTable';
import { getUsers, deleteUser, getRoles, toggleUserActive, impersonateUser, User, Role } from '@/lib/api/admin/user';
import ConfirmModal from '../_components/ConfirmModal';
import Select2 from '@/components/ui/Select2';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useToast } from '@/components/toast/ToastContainer';

export default function UsersPage() {
   const { hasPermission } = usePermissions();
   const toast = useToast();
   const [users, setUsers] = useState<User[]>([]);
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
   const [roleFilter, setRoleFilter] = useState<string>('');
   const [roles, setRoles] = useState<Role[]>([]);
   const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null; isLoading: boolean }>({
      isOpen: false,
      user: null,
      isLoading: false,
   });
   const [impersonateModal, setImpersonateModal] = useState<{ isOpen: boolean; user: User | null; isLoading: boolean }>({
      isOpen: false,
      user: null,
      isLoading: false,
   });
   const [brokenAvatars, setBrokenAvatars] = useState<Set<string>>(new Set());

   // Debounce search
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearch(searchQuery);
         setCurrentPage(1);
      }, 300);

      return () => clearTimeout(timer);
   }, [searchQuery]);

   useEffect(() => {
      fetchRolesList();
   }, []);

   const fetchUsers = useCallback(async (page: number) => {
      try {
         setIsLoading(true);
         setError('');
         const response = await getUsers(page, itemsPerPage, debouncedSearch, sortBy, sortOrder, roleFilter);

         if (response.data) {
            setUsers(response.data.data);
            if (response.data.meta) {
               setTotalPages(response.data.meta.last_page);
               setTotalItems(response.data.meta.total);
            }
         } else if (response.status === 'error') {
            setError(response.message || 'Gagal memuat daftar user');
         }
      } catch {
         setError('Terjadi kesalahan saat memuat data');
      } finally {
         setIsLoading(false);
      }
   }, [itemsPerPage, debouncedSearch, sortBy, sortOrder, roleFilter]);

   useEffect(() => {
      fetchUsers(currentPage);
   }, [currentPage, fetchUsers]);

   const fetchRolesList = async () => {
      try {
         const response = await getRoles();
         if (response.status === 'success' && response.data) {
            setRoles(response.data);
         }
      } catch (err) {
         console.error('Failed to fetch roles:', err);
      }
   };

   const handleSortChange = (field: string, order: 'asc' | 'desc') => {
      setSortBy(field);
      setSortOrder(order);
      setCurrentPage(1);
   };

   const handleRoleFilterChange = (value: string) => {
      setRoleFilter(value);
      setCurrentPage(1);
   };

   const handleDeleteClick = (user: User) => {
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
         const response = await deleteUser(deleteModal.user.uuid);

         if (response.status === 'success') {
            toast.success('User berhasil dihapus');
            setDeleteModal({ isOpen: false, user: null, isLoading: false });
            fetchUsers(currentPage);
         } else {
            toast.error(response.message || 'Gagal menghapus user');
            setDeleteModal(prev => ({ ...prev, isLoading: false }));
         }

      } catch (err: unknown) {
         const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
         toast.error(errorMsg);
         setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
   };

   const handleDeleteCancel = () => {
      setDeleteModal({ isOpen: false, user: null, isLoading: false });
   };

   const handleImpersonateClick = (user: User) => {
      setImpersonateModal({ isOpen: true, user, isLoading: false });
   };

   const handleImpersonateConfirm = async () => {
      if (!impersonateModal.user) return;
      setImpersonateModal(prev => ({ ...prev, isLoading: true }));

      try {
         const response = await impersonateUser(impersonateModal.user.id);
         if (response.status === 'success') {
            toast.success(`Berhasil login sebagai ${impersonateModal.user.name}`);
            window.location.href = '/admin';
         } else {
            toast.error(response.message || 'Gagal login sebagai user');
            setImpersonateModal(prev => ({ ...prev, isLoading: false }));
         }
      } catch {
         toast.error('Terjadi kesalahan');
         setImpersonateModal(prev => ({ ...prev, isLoading: false }));
      }
   };

   const handleImpersonateCancel = () => {
      setImpersonateModal({ isOpen: false, user: null, isLoading: false });
   };

   const handleToggleActive = async (user: User) => {
      try {
         const response = await toggleUserActive(user.uuid);

         if (response.status === 'success' && response.data) {
            const statusMsg = response.data.is_active ? 'User berhasil diaktifkan' : 'User berhasil dinonaktifkan';
            toast.success(statusMsg);
            fetchUsers(currentPage);
         } else {
            toast.error(response.message || 'Gagal mengubah status user');
         }
      } catch (err: unknown) {
         const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
         toast.error(errorMsg);
      }
   };

   // Define columns
   const columns: Column<User>[] = [
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
         key: 'user',
         label: 'Nama',
         sortable: true,
         sortValue: (row) => row.name.toLowerCase(),
         width: '20rem',
         render: (_, row) => (
            <div className="flex items-center gap-3">
               {/* Avatar */}
               <div className="shrink-0">
                  {row.avatar_url && !brokenAvatars.has(row.uuid) ? (
                     <Image
                        src={row.avatar_url}
                        alt={row.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={() => setBrokenAvatars(prev => new Set(prev).add(row.uuid))}
                     />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-[#142D52] flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                     </div>
                  )}
               </div>
               {/* Name and Email */}
               <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
                  <p className="text-xs text-gray-500 truncate">{row.email}</p>
               </div>
            </div>
         ),
      },
      {
         key: 'organization',
         label: 'Organisasi',
         sortable: false,
         width: '15rem',
         render: (_, row) => (
            <div className="text-sm">
               {row.company ? (
                  <>
                     <p className="font-medium text-gray-900">{row.company}</p>
                     {row.work_unit && (
                        <p className="text-xs text-gray-500">{row.work_unit}</p>
                     )}
                  </>
               ) : (
                  <span className="text-gray-400">-</span>
               )}
            </div>
         ),
      },
      {
         key: 'roles',
         label: 'Roles',
         sortable: false,
         width: '12rem',
         render: (_, row) => (
            <div className="flex flex-wrap gap-1">
               {row.roles && row.roles.length > 0 ? (
                  row.roles.map((role, idx) => (
                     <span
                        key={idx}
                        className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
                     >
                        {role}
                     </span>
                  ))
               ) : (
                  <span className="text-sm text-gray-400">-</span>
               )}
            </div>
         ),
      },
      {
         key: 'status',
         label: 'Status',
         sortable: false,
         width: '8rem',
         render: (_, row) => (
            row.is_active ? (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  Aktif
               </span>
            ) : (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  Tidak Aktif
               </span>
            )
         ),
      },
      {
         key: 'actions',
         label: 'Actions',
         sortable: false,
         width: '10rem',
         className: 'whitespace-nowrap',
         render: (_, row) => {
            const canEdit = hasPermission('admin.user.update');
            const canDelete = hasPermission('admin.user.delete');
            const isAdmin = row.roles?.includes('admin');
            const canImpersonate = !isAdmin;

            if (!canEdit && !canDelete && !canImpersonate) return null;

            return (
               <div className="flex items-center gap-2">
                  {canImpersonate && (
                     <button
                        onClick={() => handleImpersonateClick(row)}
                        className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2a4061] hover:bg-[#1e2f47] text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
                     >
                        <LogIn className="w-3.5 h-3.5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Login sebagai user</span>
                     </button>
                  )}
                  {canEdit && (
                     <Link
                        href={`/admin/users/${row.uuid}`}
                        className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
                     >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
                     </Link>
                  )}
                  {canEdit && (
                     <button
                        onClick={() => handleToggleActive(row)}
                        className={`relative group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium cursor-pointer ${
                           row.is_active
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        }`}
                     >
                        {row.is_active ? (
                           <ToggleRight className="w-3.5 h-3.5" />
                        ) : (
                           <ToggleLeft className="w-3.5 h-3.5" />
                        )}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                           {row.is_active ? 'Tidak Aktif' : 'Aktif'}
                        </span>
                     </button>
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
               <h1 className="text-3xl font-bold text-gray-900">Daftar User</h1>
               <p className="text-gray-600 mt-1">Kelola pengguna sistem</p>
            </div>
            {hasPermission('admin.user.create') && (
               <Link
                  href="/admin/users/create"
                  className="flex items-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors font-semibold"
               >
                  <Plus className="w-5 h-5" />
                  <span>Tambah User</span>
               </Link>
            )}
         </div>

         {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
               {error}
            </div>
         )}

         {/* Filter */}
         <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter Role</label>
                  <Select2
                     name="roleFilter"
                     value={roleFilter}
                     options={[
                        { id: '', label: 'Semua Role' },
                        ...roles.map((role) => ({ id: role.name, label: role.name })),
                     ]}
                     onChange={(e) => handleRoleFilterChange(e.target.value)}
                     placeholder="Semua Role"
                     searchable
                  />
               </div>
            </div>
         </div>

         <DataTable
            data={users}
            columns={columns}
            itemsPerPage={itemsPerPage}
            searchPlaceholder="Cari user..."
            emptyMessage="Belum ada user yang ditambahkan"
            emptyIcon={<Users className="w-16 h-16 text-gray-300 mx-auto" />}
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
            message={`Apakah Anda yakin ingin menghapus user "${deleteModal.user?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
            confirmText="Ya, Hapus"
            cancelText="Batal"
            type="danger"
            isLoading={deleteModal.isLoading}
         />

         <ConfirmModal
            isOpen={impersonateModal.isOpen}
            onClose={handleImpersonateCancel}
            onConfirm={handleImpersonateConfirm}
            title="Login Sebagai User"
            message={`Anda akan login sebagai "${impersonateModal.user?.name || ''}". Sesi admin Anda akan diganti dengan sesi user ini.`}
            confirmText="Ya, Login"
            cancelText="Batal"
            type="warning"
            isLoading={impersonateModal.isLoading}
         />
      </div>
   );
}
