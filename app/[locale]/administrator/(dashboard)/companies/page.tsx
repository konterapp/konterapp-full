'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Building2, Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { getCompaniesList, toggleCompanyActive, Company } from '@/lib/api/administrator/company';
import { useToast } from '@/components/toast/ToastContainer';

const SUBSCRIPTION_BADGE_CLASS: Record<string, string> = {
   trial: 'bg-blue-100 text-blue-700',
   active: 'bg-green-100 text-green-700',
   expired: 'bg-red-100 text-red-700',
   canceled: 'bg-gray-100 text-gray-600',
};

function formatExpiry(expiresAt: string | null | undefined) {
   if (!expiresAt) return 'Selamanya';
   return new Date(expiresAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
   });
}

function subscriptionStatusLabel(subscription: NonNullable<Company['subscription']>) {
   return subscription.status === 'active' && !subscription.expires_at
      ? 'Aktif Gratis'
      : subscription.status;
}

export default function CompaniesPage() {
   const toast = useToast();
   const [companies, setCompanies] = useState<Company[]>([]);
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

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearch(searchQuery);
         setCurrentPage(1);
      }, 300);

      return () => clearTimeout(timer);
   }, [searchQuery]);

   const fetchCompanies = useCallback(async (page: number) => {
      try {
         setIsLoading(true);
         setError('');
         const response = await getCompaniesList(page, itemsPerPage, debouncedSearch, sortBy, sortOrder);

         if (response.data) {
            setCompanies(response.data.data);
            if (response.data.meta) {
               setTotalPages(response.data.meta.last_page);
               setTotalItems(response.data.meta.total);
            }
         } else if (response.status === 'error') {
            setError(response.message || 'Gagal memuat daftar perusahaan');
         }
      } catch {
         setError('Terjadi kesalahan saat memuat data');
      } finally {
         setIsLoading(false);
      }
   }, [itemsPerPage, debouncedSearch, sortBy, sortOrder]);

   useEffect(() => {
      fetchCompanies(currentPage);
   }, [currentPage, fetchCompanies]);

   const handleSortChange = (field: string, order: 'asc' | 'desc') => {
      setSortBy(field);
      setSortOrder(order);
      setCurrentPage(1);
   };

   const handleToggleActive = async (company: Company) => {
      try {
         const response = await toggleCompanyActive(company.uuid);

         if (response.status === 'success' && response.data) {
            toast.success(response.message || 'Status perusahaan berhasil diubah');
            fetchCompanies(currentPage);
         } else {
            toast.error(response.message || 'Gagal mengubah status perusahaan');
         }
      } catch (err: unknown) {
         const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi';
         toast.error(errorMsg);
      }
   };

   const columns: Column<Company>[] = [
      {
         key: 'no',
         label: 'No',
         sortable: false,
         width: '4rem',
         render: (_, row) => {
            const index = companies.findIndex(c => c.uuid === row.uuid);
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
         // Label tombol sengaja TIDAK disembunyikan di balik tooltip hover:
         // di layar sentuh hover tidak ada, jadi tombol icon-only bikin user
         // menebak-nebak fungsinya.
         render: (_, row) => (
            <div className="flex items-center gap-2">
               <Link
                  href={`/administrator/companies/${row.uuid}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#EBC170] px-3 py-2 text-xs font-medium text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer"
               >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit</span>
               </Link>
               <button
                  onClick={() => handleToggleActive(row)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                     row.is_active
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
               >
                  {row.is_active ? (
                     <ToggleRight className="h-3.5 w-3.5" />
                  ) : (
                     <ToggleLeft className="h-3.5 w-3.5" />
                  )}
                  <span>{row.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
               </button>
            </div>
         ),
      },
      {
         key: 'code',
         label: 'Kode',
         sortable: true,
         sortValue: (row) => row.code.toLowerCase(),
         width: '10rem',
         render: (_, row) => (
            <span className="text-sm font-mono text-gray-700">{row.code}</span>
         ),
      },
      {
         key: 'name',
         label: 'Nama Perusahaan',
         sortable: true,
         sortValue: (row) => row.name.toLowerCase(),
         render: (_, row) => (
            <p className="text-sm font-medium text-gray-900">{row.name}</p>
         ),
      },
      {
         key: 'users_count',
         label: 'Pengguna',
         sortable: false,
         width: '8rem',
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.users_count ?? 0} user</span>
         ),
      },
      {
         key: 'branches_count',
         label: 'Cabang',
         sortable: false,
         width: '8rem',
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.branches_count ?? 0} cabang</span>
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
         key: 'subscription',
         label: 'Paket',
         sortable: false,
         width: '12rem',
         render: (_, row) => {
            if (!row.subscription) {
               return <span className="text-sm text-gray-400">-</span>;
            }
            return (
               <div className="text-sm">
                  <div className="flex items-center gap-1.5">
                     <span className="font-medium text-gray-900">{row.subscription.plan.name}</span>
                     <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${SUBSCRIPTION_BADGE_CLASS[row.subscription.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {subscriptionStatusLabel(row.subscription)}
                     </span>
                  </div>
                  <p className="text-xs text-gray-500">s.d. {formatExpiry(row.subscription.expires_at)}</p>
               </div>
            );
         },
      },
   ];

   // Kartu untuk layar kecil (dipakai DataTable di bawah breakpoint `lg`).
   // Pembungkus kartu, skeleton, empty state & paginasi disediakan DataTable --
   // di sini cukup isinya. Susunannya sengaja disamakan dgn halaman
   // /administrator/users: identitas -> badge sekunder -> aksi berlabel.
   const renderCompanyCard = (row: Company) => (
      <div className="space-y-3">
         <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1E3A]/5 text-[#0B1E3A]">
               <Building2 className="h-5 w-5" />
            </div>
            {/* min-w-0 wajib: tanpa itu flex child menolak menyusut & nama
                perusahaan yang panjang bikin overflow horizontal. */}
            <div className="min-w-0 flex-1">
               <p className="truncate text-sm font-semibold text-gray-900">{row.name}</p>
               <p className="truncate font-mono text-xs text-gray-500">{row.code}</p>
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
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
               {row.users_count ?? 0} user
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
               {row.branches_count ?? 0} cabang
            </span>
            {row.subscription && (
               <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                     SUBSCRIPTION_BADGE_CLASS[row.subscription.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
               >
                  {row.subscription.plan.name} &middot; {subscriptionStatusLabel(row.subscription)}
               </span>
            )}
         </div>

         {row.subscription && (
            <p className="text-xs text-gray-500">
               Berlaku s.d. {formatExpiry(row.subscription.expires_at)}
            </p>
         )}

         <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
            <Link
               href={`/administrator/companies/${row.uuid}/edit`}
               className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#EBC170] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer"
            >
               <Edit className="h-4 w-4" />
               <span>Edit</span>
            </Link>
            <button
               onClick={() => handleToggleActive(row)}
               className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors cursor-pointer ${
                  row.is_active
                     ? 'bg-green-500 text-white hover:bg-green-600'
                     : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
               }`}
            >
               {row.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
               <span>{row.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
            </button>
         </div>
      </div>
   );

   return (
      <div className="space-y-6">
         {/* Di HP judul + tombol tidak muat sebaris -- di-stack, tombolnya
             melebar penuh biar jadi target tap yang enak. */}
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
               <h1 className="text-xl font-bold text-[#142D52] sm:text-2xl">Manajemen Perusahaan</h1>
               <p className="mt-1 text-sm text-gray-600 sm:text-base">
                  Kelola tenant/perusahaan yang berlangganan KonterApp.
               </p>
            </div>
            <Link
               href="/administrator/companies/create"
               className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#EBC170] px-4 py-2.5 font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] sm:w-auto sm:py-2 cursor-pointer"
            >
               <Plus className="w-5 h-5" />
               <span>Tambah Perusahaan</span>
            </Link>
         </div>

         {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
               {error}
            </div>
         )}

         <DataTable
            data={companies}
            columns={columns}
            itemsPerPage={itemsPerPage}
            searchPlaceholder="Cari perusahaan..."
            emptyMessage="Belum ada perusahaan yang ditambahkan"
            emptyIcon={<Building2 className="w-16 h-16 text-gray-300 mx-auto" />}
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
            renderMobileCard={renderCompanyCard}
         />
      </div>
   );
}
