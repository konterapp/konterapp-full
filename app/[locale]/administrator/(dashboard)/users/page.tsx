'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Users, Plus, Edit, Trash2, User as UserIcon, ToggleLeft, ToggleRight, LogIn } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { getUsers, deleteUser, getRoles, toggleUserActive, impersonateUser, User, Role } from '@/lib/api/administrator/user';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Select2 from '@/components/ui/Select2';
import { useToast } from '@/components/toast/ToastContainer';

export default function UsersPage() {
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
            const uniqueByName = response.data.filter((role, index, self) =>
               index === self.findIndex(r => r.name === role.name)
            );
            setRoles(uniqueByName);
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

   const [isImpersonating, setIsImpersonating] = useState(false);

   const handleImpersonate = async (user: User) => {
      if (isImpersonating) return;
      setIsImpersonating(true);
      try {
         const response = await impersonateUser(user.uuid);

         if (response.status === 'success') {
            toast.success(`Berhasil login sebagai ${user.name}`);
            window.location.href = '/app';
         } else {
            toast.error(response.message || 'Gagal login sebagai user ini');
            setIsImpersonating(false);
         }
      } catch (err: unknown) {
         const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
         toast.error(errorMsg);
         setIsImpersonating(false);
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
         key: 'actions',
         label: 'Actions',
         sortable: false,
         width: '13rem',
         className: 'whitespace-nowrap',
         render: (_, row) => {
            const canEdit = true;
            const canDelete = true;

            return (
               <div className="flex items-center gap-2">
                  {row.is_active && (
                     <button
                        onClick={() => handleImpersonate(row)}
                        disabled={isImpersonating}
                        className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <LogIn className="w-3.5 h-3.5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Login as</span>
                     </button>
                  )}
                  {canEdit && (
                     <Link
                        href={`/administrator/users/${row.uuid}`}
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
      {
         key: 'user',
         label: 'Nama',
         sortable: true,
         sortValue: (row) => row.name.toLowerCase(),
         width: '20rem',
         render: (_, row) => (
            <div className="flex items-center gap-3">
               <div className="shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#142D52] flex items-center justify-center">
                     <UserIcon className="w-5 h-5 text-white" />
                  </div>
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
          key: 'email_verified',
          label: 'Verifikasi Email',
          sortable: false,
          width: '10rem',
          render: (_, row) => (
             row.email_verified_at ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                   Terverifikasi
                </span>
             ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                   </svg>
                   Belum
                </span>
             )
          ),
       },
      {
          key: 'companies',
         label: 'Perusahaan (Tenant)',
         sortable: false,
         width: '14rem',
         render: (_, row) => (
            row.companies && row.companies.length > 0 ? (
               <div className="flex flex-wrap gap-1">
                  {row.companies.map((c) => (
                     <span
                        key={c.uuid}
                        className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700"
                        title={c.is_default ? 'Perusahaan default' : undefined}
                     >
                        {c.name}{c.is_default ? ' ★' : ''}
                     </span>
                  ))}
               </div>
            ) : (
               <span className="text-sm text-gray-400">-</span>
            )
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
   ];

   // Tampilan layar kecil: 1 user = 1 kartu. Sengaja BUKAN tabel yang digeser
   // horizontal -- tabel ini 6 kolom (~77rem), tidak akan pernah nyaman di HP.
   // Tombol aksi dikasih label teks (bukan tooltip hover seperti versi desktop,
   // karena hover tidak ada di layar sentuh) & tinggi minimal 44px biar nyaman
   // dipencet.
   const renderUserCard = (row: User) => (
      <div className="space-y-3">
         <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#142D52]">
               <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
               <p className="truncate text-sm font-semibold text-gray-900">{row.name}</p>
               <p className="truncate text-xs text-gray-500">{row.email}</p>
            </div>
            <span
               className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
               }`}
            >
               {row.is_active ? 'Aktif' : 'Tidak Aktif'}
            </span>
         </div>

         <div className="flex flex-wrap gap-1.5">
            {row.roles?.map((role, idx) => (
               <span key={idx} className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                  {role}
               </span>
            ))}
            {row.companies?.map((c) => (
               <span key={c.uuid} className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                  {c.name}{c.is_default ? ' ★' : ''}
               </span>
            ))}
            <span
               className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  row.email_verified_at ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
               }`}
            >
               {row.email_verified_at ? 'Email terverifikasi' : 'Email belum verifikasi'}
            </span>
         </div>

         <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
            {row.is_active && (
               <button
                  onClick={() => handleImpersonate(row)}
                  disabled={isImpersonating}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
               >
                  <LogIn className="h-4 w-4" />
                  Login as
               </button>
            )}
            <Link
               href={`/administrator/users/${row.uuid}`}
               className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#EBC170] px-3 text-xs font-medium text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer"
            >
               <Edit className="h-4 w-4" />
               Edit
            </Link>
            <button
               onClick={() => handleToggleActive(row)}
               className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer ${
                  row.is_active
                     ? 'bg-green-500 text-white hover:bg-green-600'
                     : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
               }`}
            >
               {row.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
               {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
            <button
               onClick={() => handleDeleteClick(row)}
               /* User nonaktif tidak punya tombol "Login as", jadi tinggal 3 tombol --
                  yang terakhir dilebarkan penuh biar grid tidak menggantung sebelah. */
               className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 text-xs font-medium text-white transition-colors hover:bg-red-600 cursor-pointer ${
                  row.is_active ? '' : 'col-span-2'
               }`}
            >
               <Trash2 className="h-4 w-4" />
               Hapus
            </button>
         </div>
      </div>
   );

   return (
      <div className="space-y-4 sm:space-y-6">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
               <h1 className="text-xl font-bold text-[#142D52] sm:text-2xl">Manajemen Pengguna</h1>
               <p className="mt-1 text-sm text-gray-600 sm:text-base">Kelola data pengguna dan peran (role).</p>
            </div>
            <Link
               href="/administrator/users/create"
               className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EBC170] px-4 py-2.5 font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer sm:w-auto sm:py-2"
            >
               <Plus className="w-5 h-5" />
               <span>Tambah User</span>
            </Link>
         </div>

         {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
               {error}
            </div>
         )}

         {/* Filter */}
         <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 sm:p-4">
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
            renderMobileCard={renderUserCard}
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
      </div>
   );
}
