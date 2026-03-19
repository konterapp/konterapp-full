'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Tags, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import ConfirmModal from '../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Category {
   id: number;
   name: string;
   description: string;
   product_count: number;
   created_at: string;
}

export default function CategoriesPage() {
   const toast = useToast();
   const { hasPermission } = usePermissions();
   const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; category: Category | null; isLoading: boolean }>({
      isOpen: false,
      category: null,
      isLoading: false,
   });

   // Sample data
   const categories: Category[] = [
      {
         id: 1,
         name: 'Makanan',
         description: 'Produk makanan dan snack',
         product_count: 25,
         created_at: '2024-01-10',
      },
      {
         id: 2,
         name: 'Minuman',
         description: 'Produk minuman',
         product_count: 18,
         created_at: '2024-01-10',
      },
      {
         id: 3,
         name: 'Elektronik',
         description: 'Produk elektronik dan aksesoris',
         product_count: 12,
         created_at: '2024-01-11',
      },
      {
         id: 4,
         name: 'Kebutuhan Pokok',
         description: 'Kebutuhan pokok sehari-hari',
         product_count: 30,
         created_at: '2024-01-12',
      },
   ];

   const handleDeleteClick = (category: Category) => {
      setDeleteModal({
         isOpen: true,
         category,
         isLoading: false,
      });
   };

   const handleDeleteConfirm = async () => {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));
      // Simulate delete
      setTimeout(() => {
         toast.success('Kategori berhasil dihapus');
         setDeleteModal({ isOpen: false, category: null, isLoading: false });
      }, 500);
   };

   const handleDeleteCancel = () => {
      setDeleteModal({ isOpen: false, category: null, isLoading: false });
   };

   const columns: Column<Category>[] = [
      {
         key: 'no',
         label: 'No',
         sortable: false,
         width: '4rem',
         render: (_, row) => {
            const index = categories.findIndex(c => c.id === row.id);
            return <span className="text-sm text-gray-600">{index + 1}</span>;
         },
      },
      {
         key: 'name',
         label: 'Nama Kategori',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">{row.name}</span>
         ),
      },
      {
         key: 'description',
         label: 'Deskripsi',
         sortable: false,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.description}</span>
         ),
      },
      {
         key: 'product_count',
         label: 'Jumlah Produk',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-900">{row.product_count} produk</span>
         ),
      },
      {
         key: 'actions',
         label: 'Aksi',
         sortable: false,
         width: '8rem',
         className: 'whitespace-nowrap',
         render: (_, row) => (
            <div className="flex items-center gap-2">
               {hasPermission('admin.pos.categories.update') && (
                  <button
                     className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
                  >
                     <Edit className="w-3.5 h-3.5" />
                     <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
                  </button>
               )}
               {hasPermission('admin.pos.categories.delete') && (
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
               <h1 className="text-2xl font-bold text-gray-900">Kategori Produk</h1>
               <p className="text-gray-500 mt-1">Manajemen kategori produk</p>
            </div>
            {hasPermission('admin.pos.categories.create') && (
               <Link
                  href="/admin/pos/categories/create"
                  className="flex items-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors font-semibold"
               >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Kategori</span>
               </Link>
            )}
         </div>

         <DataTable
            data={categories}
            columns={columns}
            itemsPerPage={10}
            searchPlaceholder="Cari kategori..."
            emptyMessage="Belum ada kategori"
            emptyIcon={<Tags className="w-16 h-16 text-gray-300 mx-auto" />}
            isLoading={false}
            getRowId={(row) => row.id}
         />

         <ConfirmModal
            isOpen={deleteModal.isOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Hapus Kategori"
            message={`Apakah Anda yakin ingin menghapus kategori "${deleteModal.category?.name || ''}"?`}
            confirmText="Ya, Hapus"
            cancelText="Batal"
            type="danger"
            isLoading={deleteModal.isLoading}
         />
      </div>
   );
}
