'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Smartphone, Plus, Eye } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface PPOBProduct {
   id: number;
   code: string;
   name: string;
   category: string;
   price: number;
   status: string;
}

export default function PpobPage() {
   const { hasPermission } = usePermissions();

   // Sample data
   const products: PPOBProduct[] = [
      {
         id: 1,
         code: 'PULSA-TSEL-5K',
         name: 'Pulsa Telkomsel 5.000',
         category: 'Pulsa',
         price: 6500,
         status: 'active',
      },
      {
         id: 2,
         code: 'PULSA-ISAT-10K',
         name: 'Pulsa Indosat 10.000',
         category: 'Pulsa',
         price: 11000,
         status: 'active',
      },
      {
         id: 3,
         code: 'TOKEN-PLN-20K',
         name: 'Token PLN 20.000',
         category: 'Listrik',
         price: 21000,
         status: 'active',
      },
      {
         id: 4,
         code: 'EWALLET-GOPAY-25K',
         name: 'GoPay 25.000',
         category: 'E-Wallet',
         price: 26000,
         status: 'active',
      },
      {
         id: 5,
         code: 'EWALLET-OVO-50K',
         name: 'OVO 50.000',
         category: 'E-Wallet',
         price: 51000,
         status: 'active',
      },
   ];

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
         label: 'Kode Produk',
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
         width: '6rem',
         className: 'whitespace-nowrap',
         render: (_, row) => (
            <div className="flex items-center gap-2">
               <Link
                  href={`/admin/pos/ppob/products/${row.id}`}
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
               <h1 className="text-2xl font-bold text-gray-900">PPOB</h1>
               <p className="text-gray-500 mt-1">Pembayaran Online (Pulsa, Token PLN, E-Wallet, dll)</p>
            </div>
            {hasPermission('admin.pos.ppob.create') && (
               <Link
                  href="/admin/pos/ppob/products/create"
                  className="flex items-center space-x-2 px-4 py-2 bg-[#2a4061] text-white rounded-lg hover:bg-[#1e2f47] transition-colors font-semibold"
               >
                  <Plus className="w-5 h-5" />
                  <span>Tambah Produk</span>
               </Link>
            )}
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <p className="text-sm text-gray-600">Total Produk</p>
               <p className="text-2xl font-bold text-gray-900 mt-1">125</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <p className="text-sm text-gray-600">Produk Aktif</p>
               <p className="text-2xl font-bold text-green-600 mt-1">118</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <p className="text-sm text-gray-600">Transaksi Hari Ini</p>
               <p className="text-2xl font-bold text-blue-600 mt-1">42</p>
            </div>
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
      </div>
   );
}
