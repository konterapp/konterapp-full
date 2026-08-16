'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Building2, Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { getCompaniesList, toggleCompanyActive, Company } from '@/lib/api/administrator/company';
import { useToast } from '@/components/toast/ToastContainer';

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
            const badgeClass: Record<string, string> = {
               trial: 'bg-blue-100 text-blue-700',
               active: 'bg-green-100 text-green-700',
               expired: 'bg-red-100 text-red-700',
               canceled: 'bg-gray-100 text-gray-600',
            };
            const expiresAt = new Date(row.subscription.expires_at).toLocaleDateString('id-ID', {
               day: 'numeric',
               month: 'short',
               year: 'numeric',
            });
            return (
               <div className="text-sm">
                  <div className="flex items-center gap-1.5">
                     <span className="font-medium text-gray-900">{row.subscription.plan.name}</span>
                     <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${badgeClass[row.subscription.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {row.subscription.status}
                     </span>
                  </div>
                  <p className="text-xs text-gray-500">s.d. {expiresAt}</p>
               </div>
            );
         },
      },
      {
         key: 'actions',
         label: 'Actions',
         sortable: false,
         width: '10rem',
         className: 'whitespace-nowrap',
         render: (_, row) => (
            <div className="flex items-center gap-2">
               <Link
                  href={`/administrator/companies/${row.uuid}/edit`}
                  className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
               >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
               </Link>
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
                     {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </span>
               </button>
            </div>
         ),
      },
   ];

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold text-[#142D52]">Manajemen Perusahaan</h1>
               <p className="text-gray-600 mt-1">Kelola tenant/perusahaan yang berlangganan KonterApp.</p>
            </div>
            <Link
               href="/administrator/companies/create"
               className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
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
         />
      </div>
   );
}
