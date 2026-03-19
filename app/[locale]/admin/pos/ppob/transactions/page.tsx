'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Smartphone, Eye } from 'lucide-react';
import DataTable, { Column } from '../../../_components/DataTable';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface PPOBTransaction {
   id: number;
   transaction_number: string;
   customer_phone: string;
   product_name: string;
   price: number;
   status: string;
   created_at: string;
}

export default function PpobTransactionsPage() {
   const { hasPermission } = usePermissions();

   // Sample data
   const transactions: PPOBTransaction[] = [
      {
         id: 1,
         transaction_number: 'PPOB-2024-001',
         customer_phone: '0812-3456-7890',
         product_name: 'Pulsa Telkomsel 10.000',
         price: 11500,
         status: 'success',
         created_at: '2024-01-15 10:30:00',
      },
      {
         id: 2,
         transaction_number: 'PPOB-2024-002',
         customer_phone: '0813-4567-8901',
         product_name: 'Token PLN 20.000',
         price: 21000,
         status: 'success',
         created_at: '2024-01-15 11:15:00',
      },
      {
         id: 3,
         transaction_number: 'PPOB-2024-003',
         customer_phone: '0814-5678-9012',
         product_name: 'GoPay 25.000',
         price: 26000,
         status: 'pending',
         created_at: '2024-01-15 12:00:00',
      },
      {
         id: 4,
         transaction_number: 'PPOB-2024-004',
         customer_phone: '0815-6789-0123',
         product_name: 'OVO 50.000',
         price: 51000,
         status: 'success',
         created_at: '2024-01-15 13:30:00',
      },
      {
         id: 5,
         transaction_number: 'PPOB-2024-005',
         customer_phone: '0816-7890-1234',
         product_name: 'Paket Data XL 2GB',
         price: 25000,
         status: 'failed',
         created_at: '2024-01-15 14:45:00',
      },
      {
         id: 6,
         transaction_number: 'PPOB-2024-006',
         customer_phone: '0817-8901-2345',
         product_name: 'Pulsa Indosat 5.000',
         price: 6000,
         status: 'success',
         created_at: '2024-01-15 15:30:00',
      },
   ];

   const columns: Column<PPOBTransaction>[] = [
      {
         key: 'no',
         label: 'No',
         sortable: false,
         width: '4rem',
         render: (_, row) => {
            const index = transactions.findIndex(t => t.id === row.id);
            return <span className="text-sm text-gray-600">{index + 1}</span>;
         },
      },
      {
         key: 'transaction_number',
         label: 'No. Transaksi',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">{row.transaction_number}</span>
         ),
      },
      {
         key: 'customer_phone',
         label: 'Nomor Pelanggan',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-900">{row.customer_phone}</span>
         ),
      },
      {
         key: 'product_name',
         label: 'Produk',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-900">{row.product_name}</span>
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
            row.status === 'success' ? (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  Berhasil
               </span>
            ) : row.status === 'pending' ? (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                  Pending
               </span>
            ) : (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  Gagal
               </span>
            )
         ),
      },
      {
         key: 'created_at',
         label: 'Tanggal',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.created_at}</span>
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
                  href={`/admin/pos/ppob/transactions/${row.id}`}
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
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaksi PPOB</h1>
            <p className="text-gray-500 mt-1">Riwayat transaksi PPOB</p>
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <p className="text-sm text-gray-600">Total Transaksi</p>
               <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <p className="text-sm text-gray-600">Berhasil</p>
               <p className="text-2xl font-bold text-green-600 mt-1">142</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <p className="text-sm text-gray-600">Pending</p>
               <p className="text-2xl font-bold text-yellow-600 mt-1">8</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
               <p className="text-sm text-gray-600">Gagal</p>
               <p className="text-2xl font-bold text-red-600 mt-1">6</p>
            </div>
         </div>

         <DataTable
            data={transactions}
            columns={columns}
            itemsPerPage={10}
            searchPlaceholder="Cari transaksi PPOB..."
            emptyMessage="Belum ada transaksi PPOB"
            emptyIcon={<Smartphone className="w-16 h-16 text-gray-300 mx-auto" />}
            isLoading={false}
            getRowId={(row) => row.id}
         />
      </div>
   );
}
