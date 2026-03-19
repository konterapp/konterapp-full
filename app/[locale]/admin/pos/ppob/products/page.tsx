'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Smartphone, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable, { Column } from '../../../_components/DataTable';
import ConfirmModal from '../../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface PPOBProduct {
   id: number;
   code: string;
   name: string;
   category: string;
   provider: string;
   nominal: number;
   price: number;
   status: string;
}

export default function PpobProductsPage() {
   const toast = useToast();
   const { hasPermission } = usePermissions();
   const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: PPOBProduct | null; isLoading: boolean }>({
      isOpen: false,
      product: null,
      isLoading: false,
   });

   // Sample data
   const products: PPOBProduct[] = [
      {
         id: 1,
         code: 'PULSA-TSEL-5K',
         name: 'Pulsa Telkomsel 5.000',
         category: 'Pulsa',
         provider: 'Telkomsel',
         nominal: 5000,
         price: 6500,
         status: 'active',
      },
      {
         id: 2,
         code: 'PULSA-TSEL-10K',
         name: 'Pulsa Telkomsel 10.000',
         category: 'Pulsa',
         provider: 'Telkomsel',
         nominal: 10000,
         price: 11500,
         status: 'active',
      },
      {
         id: 3,
         code: 'PULSA-ISAT-5K',
         name: 'Pulsa Indosat 5.000',
         category: 'Pulsa',
         provider: 'Indosat',
         nominal: 5000,
         price: 6000,
         status: 'active',
      },
      {
         id: 4,
         code: 'PULSA-XL-10K',
         name: 'Pulsa XL 10.000',
         category: 'Pulsa',
         provider: 'XL',
         nominal: 10000,
         price: 11000,
         status: 'active',
      },
      {
         id: 5,
         code: 'TOKEN-PLN-20K',
         name: 'Token PLN 20.000',
         category: 'Listrik',
         provider: 'PLN',
         nominal: 20000,
         price: 21000,
         status: 'active',
      },
      {
         id: 6,
         code: 'TOKEN-PLN-50K',
         name: 'Token PLN 50.000',
         category: 'Listrik',
         provider: 'PLN',
         nominal: 50000,
         price: 51000,
         status: 'active',
      },
      {
         id: 7,
         code: 'EWALLET-GOPAY-25K',
         name: 'GoPay 25.000',
         category: 'E-Wallet',
         provider: 'GoPay',
         nominal: 25000,
         price: 26000,
         status: 'active',
      },
      {
         id: 8,
         code: 'EWALLET-OVO-50K',
         name: 'OVO 50.000',
         category: 'E-Wallet',
         provider: 'OVO',
         nominal: 50000,
         price: 51000,
         status: 'active',
      },
      {
         id: 9,
         code: 'EWALLET-DANA-20K',
         name: 'DANA 20.000',
         category: 'E-Wallet',
         provider: 'DANA',
         nominal: 20000,
         price: 21000,
         status: 'active',
      },
      {
         id: 10,
         code: 'PAKET-DATA-TSEL-1GB',
         name: 'Paket Data Telkomsel 1GB',
         category: 'Data',
         provider: 'Telkomsel',
         nominal: 1,
         price: 15000,
         status: 'active',
      },
   ];

   const handleDeleteClick = (product: PPOBProduct) => {
      setDeleteModal({
         isOpen: true,
         product,
         isLoading: false,
      });
   };

   const handleDeleteConfirm = async () => {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));
      // Simulate delete
      setTimeout(() => {
         toast.success('Produk PPOB berhasil dihapus');
         setDeleteModal({ isOpen: false, product: null, isLoading: false });
      }, 500);
   };

   const handleDeleteCancel = () => {
      setDeleteModal({ isOpen: false, product: null, isLoading: false });
   };

   const columns: Column<PPOBProduct>[] = [
      {
         key: 'no',
         label: 'No',
         sortable: false,
         width: '4rem',
         render: (_, row) => {
            const index = products.findIndex(p => p.id === row.id);
            return <span className="text-sm text-gray-600">{index + 1}</span>;
         },
      },
      {
         key: 'code',
         label: 'Kode',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-mono text-gray-600">{row.code}</span>
         ),
      },
      {
         key: 'name',
         label: 'Nama Produk',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">{row.name}</span>
         ),
      },
      {
         key: 'category',
         label: 'Kategori',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.category}</span>
         ),
      },
      {
         key: 'provider',
         label: 'Provider',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.provider}</span>
         ),
      },
      {
         key: 'nominal',
         label: 'Nominal',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-900">
               {row.category === 'Data' ? `${row.nominal}GB` : `Rp ${row.nominal.toLocaleString('id-ID')}`}
            </span>
         ),
      },
      {
         key: 'price',
         label: 'Harga',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">
               Rp {row.price.toLocaleString('id-ID')}
            </span>
         ),
      },
      {
         key: 'status',
         label: 'Status',
         sortable: true,
         render: (_, row) => (
            row.status === 'active' ? (
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
         label: 'Aksi',
         sortable: false,
         width: '8rem',
         className: 'whitespace-nowrap',
         render: (_, row) => (
            <div className="flex items-center gap-2">
               {hasPermission('admin.pos.ppob.products.update') && (
                  <button
                     className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
                  >
                     <Edit className="w-3.5 h-3.5" />
                     <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
                  </button>
               )}
               {hasPermission('admin.pos.ppob.products.delete') && (
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
               <h1 className="text-2xl font-bold text-gray-900">Produk PPOB</h1>
               <p className="text-gray-500 mt-1">Manajemen produk PPOB</p>
            </div>
            {hasPermission('admin.pos.ppob.products.create') && (
               <Link
                  href="/admin/pos/ppob/products/create"
                  className="flex items-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors font-semibold"
               >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Produk</span>
               </Link>
            )}
         </div>

         <DataTable
            data={products}
            columns={columns}
            itemsPerPage={10}
            searchPlaceholder="Cari produk PPOB..."
            emptyMessage="Belum ada produk PPOB"
            emptyIcon={<Smartphone className="w-16 h-16 text-gray-300 mx-auto" />}
            isLoading={false}
            getRowId={(row) => row.id}
         />

         <ConfirmModal
            isOpen={deleteModal.isOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Hapus Produk PPOB"
            message={`Apakah Anda yakin ingin menghapus produk "${deleteModal.product?.name || ''}"?`}
            confirmText="Ya, Hapus"
            cancelText="Batal"
            type="danger"
            isLoading={deleteModal.isLoading}
         />
      </div>
   );
}
