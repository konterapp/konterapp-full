'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ShoppingCart, Plus, Eye } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Purchase {
   id: number;
   purchase_number: string;
   supplier_name: string;
   total: number;
   status: string;
   purchase_date: string;
}

export default function PurchasesPage() {
   const { hasPermission } = usePermissions();

   // Sample data
   const purchases: Purchase[] = [
      {
         id: 1,
         purchase_number: 'PO-2024-001',
         supplier_name: 'PT. Sumber Makmur',
         total: 5000000,
         status: 'received',
         purchase_date: '2024-01-10',
      },
      {
         id: 2,
         purchase_number: 'PO-2024-002',
         supplier_name: 'CV. Jaya Abadi',
         total: 3500000,
         status: 'pending',
         purchase_date: '2024-01-12',
      },
      {
         id: 3,
         purchase_number: 'PO-2024-003',
         supplier_name: 'UD. Sentosa',
         total: 2750000,
         status: 'ordered',
         purchase_date: '2024-01-14',
      },
      {
         id: 4,
         purchase_number: 'PO-2024-004',
         supplier_name: 'PT. Sumber Makmur',
         total: 4200000,
         status: 'received',
         purchase_date: '2024-01-15',
      },
   ];

   const columns: Column<Purchase>[] = [
      {
         key: 'no',
         label: 'No',
         sortable: false,
         width: '4rem',
         render: (_, row) => {
            const index = purchases.findIndex(p => p.id === row.id);
            return <span className="text-sm text-gray-600">{index + 1}</span>;
         },
      },
      {
         key: 'purchase_number',
         label: 'No. Pembelian',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">{row.purchase_number}</span>
         ),
      },
      {
         key: 'supplier_name',
         label: 'Supplier',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-900">{row.supplier_name}</span>
         ),
      },
      {
         key: 'total',
         label: 'Total',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">
               Rp {row.total.toLocaleString('id-ID')}
            </span>
         ),
      },
      {
         key: 'status',
         label: 'Status',
         sortable: true,
         render: (_, row) => (
            row.status === 'received' ? (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  Diterima
               </span>
            ) : row.status === 'ordered' ? (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  Dipesan
               </span>
            ) : (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                  Pending
               </span>
            )
         ),
      },
      {
         key: 'purchase_date',
         label: 'Tanggal',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.purchase_date}</span>
         ),
      },
      {
         key: 'actions',
         label: 'Aksi',
         sortable: false,
         width: '6rem',
         className: 'whitespace-nowrap',
         render: (_, row) => (
            <div className="flex items-center gap-2">
               <Link
                  href={`/admin/pos/purchases/${row.id}`}
                  className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2a4061] text-white hover:bg-[#1e2f47] rounded-lg transition-colors text-xs font-medium cursor-pointer"
               >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Detail</span>
               </Link>
            </div>
         ),
      },
   ];

   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold text-gray-900">Pembelian</h1>
               <p className="text-gray-500 mt-1">Manajemen pembelian stok</p>
            </div>
            {hasPermission('admin.pos.purchases.create') && (
               <Link
                  href="/admin/pos/purchases/create"
                  className="flex items-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors font-semibold"
               >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Pembelian</span>
               </Link>
            )}
         </div>

         <DataTable
            data={purchases}
            columns={columns}
            itemsPerPage={10}
            searchPlaceholder="Cari pembelian..."
            emptyMessage="Belum ada pembelian"
            emptyIcon={<ShoppingCart className="w-16 h-16 text-gray-300 mx-auto" />}
            isLoading={false}
            getRowId={(row) => row.id}
         />
      </div>
   );
}
