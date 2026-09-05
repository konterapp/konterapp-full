'use client';

import { useState, useMemo, useEffect, ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, Filter, Loader2 } from 'lucide-react';

export type SortOrder = 'asc' | 'desc';

export interface Column<T> {
   key: string;
   label: ReactNode;
   sortable?: boolean;

   render?: (value: any, row: T) => ReactNode;
   sortValue?: (row: T) => string | number;
   width?: string;
   className?: string;
}

export interface DataTableProps<T> {
   data: T[];
   columns: Column<T>[];
   itemsPerPage?: number;
   searchPlaceholder?: string;
   filterComponent?: ReactNode;
   actionComponent?: ReactNode;
   emptyMessage?: string;
   emptyIcon?: ReactNode;
   onRowClick?: (row: T) => void;
   getRowId?: (row: T) => string | number;
   /**
    * Kalau diisi, layar kecil menampilkan daftar KARTU (bukan tabel yang harus
    * digeser horizontal) -- search, filter, loading, empty state & paginasi
    * tetap dipakai bareng. Halaman yang TIDAK mengirim prop ini perilakunya
    * sama persis seperti sebelumnya (tabel + scroll horizontal di mobile).
    */
   renderMobileCard?: (row: T) => ReactNode;
   /** Batas layar peralihan kartu -> tabel. Default `lg` (1024px), samakan dengan breakpoint sidebar. */
   mobileBreakpoint?: 'md' | 'lg';
   /**
    * Di tampilan kartu, daftar dimuat dengan infinite scroll (halaman berikutnya
    * ditambahkan saat digulir sampai bawah) dan tombol paginasi disembunyikan --
    * di HP menekan angka halaman jauh lebih repot daripada terus menggulir.
    * Otomatis aktif kalau `renderMobileCard` diisi; set `false` untuk tetap
    * memakai paginasi. Tabel di layar besar SELALU memakai paginasi.
    */
   mobileInfiniteScroll?: boolean;
   // Server-side pagination props
   serverSide?: boolean;
   currentPage?: number;
   totalPages?: number;
   totalItems?: number;
   onPageChange?: (page: number) => void;
   onItemsPerPageChange?: (itemsPerPage: number) => void;
   searchQuery?: string;
   onSearchChange?: (query: string) => void;
   sortBy?: string;
   sortOrder?: SortOrder;
   onSortChange?: (field: string, order: SortOrder) => void;
   isLoading?: boolean;
}


export default function DataTable<T extends Record<string, any>>({
   data,
   columns,
   itemsPerPage = 10,
   searchPlaceholder = 'Search...',
   filterComponent,
   actionComponent,
   emptyMessage = 'No data found',
   emptyIcon,
   onRowClick,
   getRowId = (row) => row.id,
   renderMobileCard,
   mobileBreakpoint = 'lg',
   mobileInfiniteScroll = true,
   serverSide = false,
   currentPage: externalCurrentPage,
   totalPages: externalTotalPages,
   totalItems: externalTotalItems,
   onPageChange,
   onItemsPerPageChange,
   searchQuery: externalSearchQuery,
   onSearchChange,
   sortBy: externalSortBy,
   sortOrder: externalSortOrder,
   onSortChange,
   isLoading = false,
}: DataTableProps<T>) {
   const [internalSortField, setInternalSortField] = useState<string | null>(null);
   const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>('asc');
   const [internalCurrentPage, setInternalCurrentPage] = useState(1);
   const [internalSearchQuery, setInternalSearchQuery] = useState('');
   const [showFilter, setShowFilter] = useState(false);

   // Use external or internal state
   const currentPage = serverSide ? (externalCurrentPage || 1) : internalCurrentPage;
   const setCurrentPage = serverSide ? (onPageChange || (() => { })) : setInternalCurrentPage;
   const searchQuery = serverSide ? (externalSearchQuery || '') : internalSearchQuery;
   const setSearchQuery = serverSide ? (onSearchChange || (() => { })) : setInternalSearchQuery;
   const sortField = serverSide ? externalSortBy : internalSortField;
   const sortOrder = serverSide ? (externalSortOrder || 'asc') : internalSortOrder;

   // Filter data by search query (only for client-side)
   const filteredData = useMemo(() => {
      if (serverSide) return data;
      if (!searchQuery.trim()) return data;

      const query = searchQuery.toLowerCase();
      return data.filter((row) => {
         return columns.some((col) => {
            const value = row[col.key];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(query);
         });
      });
   }, [data, searchQuery, columns, serverSide]);

   // Sort data (only for client-side)
   const sortedData = useMemo(() => {
      if (serverSide) return filteredData;
      if (!sortField) return filteredData;

      const column = columns.find((col) => col.key === sortField);
      if (!column || !column.sortable) return filteredData;

      return [...filteredData].sort((a, b) => {
         let aValue: string | number;
         let bValue: string | number;

         if (column.sortValue) {
            aValue = column.sortValue(a);
            bValue = column.sortValue(b);
         } else {
            aValue = a[sortField];
            bValue = b[sortField];
         }

         // Handle null/undefined
         if (aValue === null || aValue === undefined) return 1;
         if (bValue === null || bValue === undefined) return -1;

         // Convert to string for comparison if needed
         if (typeof aValue === 'string') aValue = aValue.toLowerCase();
         if (typeof bValue === 'string') bValue = bValue.toLowerCase();

         if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
         if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
         return 0;
      });
   }, [filteredData, sortField, sortOrder, columns, serverSide]);

   // Pagination
   const totalPages = serverSide ? (externalTotalPages || 1) : Math.ceil(sortedData.length / itemsPerPage);
   const totalItems = serverSide ? (externalTotalItems || data.length) : sortedData.length;
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   // useMemo supaya identitas array stabil antar render: efek akumulasi infinite
   // scroll di bawah memakainya sebagai dependency, dan slice baru tiap render
   // akan membuat efek itu jalan terus-menerus.
   const paginatedData = useMemo(
      () => (serverSide ? data : sortedData.slice(startIndex, endIndex)),
      [serverSide, data, sortedData, startIndex, endIndex],
   );

   const handleSort = (field: string) => {
      const column = columns.find((col) => col.key === field);
      if (!column || !column.sortable) return;

      const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';

      if (serverSide && onSortChange) {
         onSortChange(field, newSortOrder);
      } else {
         setInternalSortField(field);
         setInternalSortOrder(newSortOrder);
      }
      setCurrentPage(1);
   };

   const getSortIcon = (field: string) => {
      if (sortField !== field) {
         return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
      }
      return sortOrder === 'asc'
         ? <ArrowUp className="w-4 h-4 text-gray-700" />
         : <ArrowDown className="w-4 h-4 text-gray-700" />;
   };

   // Class ditulis literal (bukan string dinamis) supaya tidak kena purge Tailwind.
   const responsiveClasses = {
      md: { cardsOnly: 'md:hidden', tableOnly: 'hidden md:block', tableOnlyFlex: 'hidden md:flex' },
      lg: { cardsOnly: 'lg:hidden', tableOnly: 'hidden lg:block', tableOnlyFlex: 'hidden lg:flex' },
   }[mobileBreakpoint];
   const hasMobileCards = Boolean(renderMobileCard);
   const infiniteScrollActive = hasMobileCards && mobileInfiniteScroll;

   // Identitas stabil satu baris, dipakai untuk key React sekaligus dedupe saat
   // baris ditumpuk oleh infinite scroll. `null` = baris tidak punya id, jatuh
   // kembali ke index seperti sebelumnya.
   const rowIdentity = (row: T): string | null => {
      const id = getRowId?.(row) ?? row.uuid ?? row.id;
      return id === undefined || id === null ? null : String(id);
   };

   // Halaman induk (serverSide) MENGGANTI `data` tiap pindah halaman, jadi baris
   // hasil scroll harus ditumpuk di sini.
   const [accumulatedRows, setAccumulatedRows] = useState<T[]>([]);
   // Halaman yang datanya sudah benar-benar masuk ke `accumulatedRows`. Dipakai
   // sebagai gerbang observer di bawah, jadi harus state (bukan ref) supaya
   // perubahannya menjalankan ulang efek itu.
   const [loadedPage, setLoadedPage] = useState(0);

   useEffect(() => {
      if (!infiniteScrollActive || isLoading) return;
      // Halaman 1 dipakai sebagai satu-satunya sinyal reset: setiap perubahan
      // cari/urut/jumlah-per-halaman selalu mengembalikan induk ke halaman 1.
      // Membandingkan kueri secara langsung TIDAK bisa dipakai -- induk mencari
      // dengan nilai debounce, jadi ada jeda saat kueri sudah berubah tapi
      // datanya masih milik kueri lama, dan sebaris sisa ikut tertinggal.
      setAccumulatedRows((rows) => {
         if (currentPage <= 1) return paginatedData;
         // Dedupe sebelum ditambahkan: efek ini bisa jalan lagi untuk halaman yang
         // sama saat induk me-render ulang dengan array baru. Tanpa ini key React
         // jadi kembar dan React meninggalkan node lama di DOM -- daftarnya
         // terlihat menggandakan diri padahal datanya benar.
         const seen = new Set(rows.map(rowIdentity).filter((key): key is string => key !== null));
         return [...rows, ...paginatedData.filter((row) => {
            const key = rowIdentity(row);
            return key === null || !seen.has(key);
         })];
      });
      setLoadedPage(currentPage);
   }, [paginatedData, currentPage, isLoading, infiniteScrollActive]);

   const mobileRows = infiniteScrollActive ? accumulatedRows : paginatedData;
   const hasMoreRows = currentPage < totalPages;

   // Sentinel diamati IntersectionObserver, bukan event scroll: yang menggulir di
   // app ini elemen <main> (shell-nya h-dvh + overflow-hidden), jadi listener di
   // window tidak akan pernah kena.
   //
   // Simpan node-nya sebagai STATE lewat callback ref, bukan useRef. Sentinel baru
   // ikut ter-render satu render setelah baris pertama masuk, sedangkan efek di
   // bawah tidak punya alasan untuk jalan ulang saat itu -- dengan useRef ia
   // membaca `null`, keluar lebih awal, dan observer tidak pernah terpasang.
   const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);

   useEffect(() => {
      // `loadedPage !== currentPage` = permintaan halaman berikutnya masih jalan.
      // Menggantungkan gerbang ini pada `isLoading` saja tidak cukup: ada satu
      // render setelah `setCurrentPage` di mana induk belum sempat menyalakan
      // `isLoading`, dan di situ observer terpasang lagi lalu langsung menyala --
      // halaman 3 & 4 ikut diminta padahal 2 belum tiba, dan barisnya hilang.
      if (!infiniteScrollActive || !hasMoreRows || isLoading || !sentinelEl) return;
      if (loadedPage !== currentPage) return;

      const observer = new IntersectionObserver(
         (entries) => {
            if (entries[0]?.isIntersecting) setCurrentPage(currentPage + 1);
         },
         { rootMargin: '200px' },
      );
      observer.observe(sentinelEl);
      return () => observer.disconnect();
   }, [infiniteScrollActive, hasMoreRows, isLoading, currentPage, loadedPage, setCurrentPage, sentinelEl]);

   return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
         {/* Search and Filter */}
         <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                     setSearchQuery(e.target.value);
                     if (!serverSide) {
                        setCurrentPage(1);
                     }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
               />
            </div>
            {actionComponent}
            {filterComponent && (
               <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`flex shrink-0 items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${showFilter ? 'bg-gray-50' : ''}`}
               >
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="hidden sm:inline">Filter</span>
               </button>
            )}
         </div>

         {/* Filter Component */}
         {showFilter && filterComponent && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
               {filterComponent}
            </div>
         )}

         {/* Kartu (layar kecil) -- hanya kalau halaman menyediakan renderMobileCard */}
         {hasMobileCards && (
            <div className={responsiveClasses.cardsOnly}>
               {isLoading && mobileRows.length === 0 ? (
                  <div className="space-y-3">
                     {Array.from({ length: Math.min(itemsPerPage, 5) }).map((_, index) => (
                        <div key={`skeleton-card-${index}`} className="rounded-xl border border-gray-200 p-4">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200" />
                              <div className="min-w-0 flex-1 space-y-2">
                                 <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                                 <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                              </div>
                           </div>
                           <div className="mt-4 h-9 animate-pulse rounded-lg bg-gray-100" />
                        </div>
                     ))}
                  </div>
               ) : mobileRows.length > 0 ? (
                  <div className="space-y-3">
                     {mobileRows.map((row, index) => {
                        const rowKey = rowIdentity(row) ?? index;
                        return (
                           <div
                              key={rowKey}
                              onClick={() => onRowClick?.(row)}
                              className={`rounded-xl border border-gray-200 p-4 transition-colors ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
                           >
                              {renderMobileCard!(row)}
                           </div>
                        );
                     })}

                     {infiniteScrollActive && (
                        <>
                           <div ref={setSentinelEl} aria-hidden className="h-px" />
                           <div className="py-3 text-center text-xs text-gray-500" aria-live="polite">
                              {isLoading ? (
                                 <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memuat data lain...
                                 </span>
                              ) : hasMoreRows ? (
                                 `Menampilkan ${mobileRows.length} dari ${totalItems} data`
                              ) : (
                                 `Semua data sudah dimuat (${totalItems})`
                              )}
                           </div>
                        </>
                     )}
                  </div>
               ) : (
                  <div className="py-10 text-center">
                     {emptyIcon}
                     <p className="mt-4 text-gray-500">{emptyMessage}</p>
                  </div>
               )}
            </div>
         )}

         {/* Table */}
         <div className={`overflow-x-auto ${hasMobileCards ? responsiveClasses.tableOnly : ''}`}>
            <table className="w-full" style={{ tableLayout: 'auto', width: '100%' }}>
               <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                     {columns.map((column) => (
                        <th
                           key={column.key}
                           className={`text-left py-3 px-4 text-sm font-semibold text-gray-700 ${column.className || ''}`}
                           style={{
                              ...(column.width ? { width: column.width, minWidth: column.width } : {}),
                              whiteSpace: 'normal',
                              wordBreak: 'normal',
                           }}
                        >
                           {column.sortable ? (
                              <button
                                 onClick={() => handleSort(column.key)}
                                 className="flex items-center justify-between w-full hover:text-gray-900 transition-colors cursor-pointer"
                              >
                                 <span>{column.label}</span>
                                 {getSortIcon(column.key)}
                              </button>
                           ) : (
                              <span>{column.label}</span>
                           )}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     // Skeleton loading rows
                     Array.from({ length: itemsPerPage }).map((_, index) => (
                        <tr key={`skeleton-${index}`} className="border-b border-gray-100">
                           {columns.map((column) => (
                              <td
                                 key={column.key}
                                 className={`py-3 px-4 ${column.className || ''}`}
                                 style={{
                                    ...(column.width ? { width: column.width, minWidth: column.width } : {}),
                                 }}
                              >
                                 <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                              </td>
                           ))}
                        </tr>
                     ))
                  ) : paginatedData.length > 0 ? (
                     paginatedData.map((row, index) => {
                        const rowKey = getRowId?.(row) ?? row.uuid ?? row.id ?? index;
                        return (
                        <tr
                           key={rowKey}
                           onClick={() => onRowClick?.(row)}
                           className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''
                              }`}
                        >
                           {columns.map((column) => (
                              <td
                                 key={column.key}
                                 className={`py-3 px-4 ${column.className || ''}`}
                                 style={{
                                    ...(column.width ? { width: column.width, minWidth: column.width } : {}),
                                    whiteSpace: 'normal',
                                    wordBreak: 'normal',
                                 }}
                              >
                                 {column.render
                                    ? column.render(row[column.key], row)
                                    : <span className="text-sm text-gray-900">{row[column.key]}</span>
                                 }
                              </td>
                           ))}
                        </tr>
                     );
                     })
                  ) : (
                     <tr>
                        <td colSpan={columns.length} className="py-12 text-center">
                           {emptyIcon}
                           <p className="text-gray-500 text-lg mt-4">{emptyMessage}</p>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         {totalItems > 0 && (
            <div className={`${infiniteScrollActive ? responsiveClasses.tableOnlyFlex : 'flex'} flex-col gap-3 pt-4 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-2`}>
               <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="text-xs text-gray-600 sm:text-sm">
                     Menampilkan <span className="font-semibold">{startIndex + 1}</span> -{' '}
                     <span className="font-semibold">{Math.min(endIndex, totalItems)}</span> dari{' '}
                     <span className="font-semibold">{totalItems}</span> data
                  </div>
                  {serverSide && onItemsPerPageChange && (
                     <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 sm:text-sm">Per halaman:</span>
                        <select
                           value={itemsPerPage}
                           onChange={(e) => {
                              onItemsPerPageChange(Number(e.target.value));
                              setCurrentPage(1);
                           }}
                           className="px-3 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                        >
                           <option value={10}>10</option>
                           <option value={25}>25</option>
                           <option value={50}>50</option>
                           <option value={100}>100</option>
                        </select>
                     </div>
                  )}
               </div>
               <div className="flex items-center justify-center space-x-2 sm:justify-end">
                  <button
                     onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                     disabled={currentPage === 1}
                     className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200"
                  >
                     <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="flex items-center space-x-1">
                     {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                           page === 1 ||
                           page === totalPages ||
                           (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                           return (
                              <button
                                 key={page}
                                 onClick={() => setCurrentPage(page)}
                                 className={`min-w-9 px-2.5 py-2 sm:px-3 sm:py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentPage === page
                                    ? 'bg-[#2a4061] text-white hover:bg-[#1e2f47]'
                                    : 'border border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-700'
                                    }`}
                              >
                                 {page}
                              </button>
                           );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                           return <span key={page} className="px-2 text-gray-400">...</span>;
                        }
                        return null;
                     })}
                  </div>

                  <button
                     onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                     disabled={currentPage === totalPages}
                     className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200"
                  >
                     <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}
