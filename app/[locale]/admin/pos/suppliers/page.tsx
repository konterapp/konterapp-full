'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Truck, Plus, Edit, Trash2, Phone, MapPin } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import ConfirmModal from '../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Supplier {
   id: number;
   name: string;
   contact_person: string;
   phone: string;
   address: string;
   email: string;
   status: string;
}

export default function SuppliersPage() {
   const toast = useToast();
   const { hasPermission } = usePermissions();
   const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; supplier: Supplier | null; isLoading: boolean }>({
      isOpen: false,
      supplier: null,
      isLoading: false,
   });

   // Sample data
   const suppliers: Supplier[] = [
      {
         id: 1,
         name: 'PT. Sumber Makmur',
         contact_person: 'Budi Santoso',
         phone: '0812-3456-7890',
         address: 'Jl. Raya Utama No. 123, Jakarta',
         email: 'info@sumbermakmur.com',
         status: 'active',
      },
      {
         id: 2,
         name: 'CV. Jaya Abadi',
         contact_person: 'Siti Aminah',
         phone: '0813-4567-8901',
         address: 'Jl. Merdeka No. 45, Bandung',
         email: 'contact@jayaabadi.com',
         status: 'active',
      },
      {
         id: 3,
         name: 'UD. Sentosa',
         contact_person: 'Ahmad Wijaya',
         phone: '0814-5678-9012',
         address: 'Jl. Sudirman No. 78, Surabaya',
         email: 'sentosa@email.com',
         status: 'inactive',
      },
   ];

   const handleDeleteClick = (supplier: Supplier) => {
      setDeleteModal({
         isOpen: true,
         supplier,
         isLoading: false,
      });
   };

   const handleDeleteConfirm = async () => {
      setDeleteModal(prev => ({ ...prev, isLoading: true }));
      // Simulate delete
      setTimeout(() => {
         toast.success('Supplier berhasil dihapus');
         setDeleteModal({ isOpen: false, supplier: null, isLoading: false });
      }, 500);
   };

   const handleDeleteCancel = () => {
      setDeleteModal({ isOpen: false, supplier: null, isLoading: false });
   };

   const columns: Column<Supplier>[] = [
      {
         key: 'no',
         label: 'No',
         sortable: false,
         width: '4rem',
         render: (_, row) => {
            const index = suppliers.findIndex(s => s.id === row.id);
            return <span className="text-sm text-gray-600">{index + 1}</span>;
         },
      },
      {
         key: 'name',
         label: 'Nama Supplier',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">{row.name}</span>
         ),
      },
      {
         key: 'contact_person',
         label: 'Kontak Person',
         sortable: true,
         render: (_, row) => (
            <div className="flex items-center gap-2">
               <span className="text-sm text-gray-900">{row.contact_person}</span>
            </div>
         ),
      },
      {
         key: 'phone',
         label: 'Telepon',
         sortable: false,
         render: (_, row) => (
            <div className="flex items-center gap-2">
               <Phone className="w-4 h-4 text-gray-400" />
               <span className="text-sm text-gray-600">{row.phone}</span>
            </div>
         ),
      },
      {
         key: 'address',
         label: 'Alamat',
         sortable: false,
         render: (_, row) => (
            <div className="flex items-center gap-2 max-w-xs">
               <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
               <span className="text-sm text-gray-600 truncate">{row.address}</span>
            </div>
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
               {hasPermission('admin.pos.suppliers.update') && (
                  <button
                     className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
                  >
                     <Edit className="w-3.5 h-3.5" />
                     <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
                  </button>
               )}
               {hasPermission('admin.pos.suppliers.delete') && (
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
               <h1 className="text-2xl font-bold text-gray-900">Supplier</h1>
               <p className="text-gray-500 mt-1">Manajemen supplier dan pemasok</p>
            </div>
            {hasPermission('admin.pos.suppliers.create') && (
               <Link
                  href="/admin/pos/suppliers/create"
                  className="flex items-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors font-semibold"
               >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Supplier</span>
               </Link>
            )}
         </div>

         <DataTable
            data={suppliers}
            columns={columns}
            itemsPerPage={10}
            searchPlaceholder="Cari supplier..."
            emptyMessage="Belum ada supplier"
            emptyIcon={<Truck className="w-16 h-16 text-gray-300 mx-auto" />}
            isLoading={false}
            getRowId={(row) => row.id}
         />

         <ConfirmModal
            isOpen={deleteModal.isOpen}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Hapus Supplier"
            message={`Apakah Anda yakin ingin menghapus supplier "${deleteModal.supplier?.name || ''}"?`}
            confirmText="Ya, Hapus"
            cancelText="Batal"
            type="danger"
            isLoading={deleteModal.isLoading}
         />
      </div>
   );
}
