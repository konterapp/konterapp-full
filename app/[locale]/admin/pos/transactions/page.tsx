'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Receipt, Eye, Printer } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Transaction {
   id: number;
   invoice_number: string;
   cashier_name: string;
   total: number;
   payment_method: string;
   status: string;
   created_at: string;
}

export default function TransactionsPage() {
   const { hasPermission } = usePermissions();

   // Sample data
   const transactions: Transaction[] = [
      {
         id: 1,
         invoice_number: 'INV-2024-001',
         cashier_name: 'Admin',
         total: 150000,
         payment_method: 'Tunai',
         status: 'completed',
         created_at: '2024-01-15 10:30:00',
      },
      {
         id: 2,
         invoice_number: 'INV-2024-002',
         cashier_name: 'Admin',
         total: 75000,
         payment_method: 'QRIS',
         status: 'completed',
         created_at: '2024-01-15 11:15:00',
      },
      {
         id: 3,
         invoice_number: 'INV-2024-003',
         cashier_name: 'Kasir 1',
         total: 200000,
         payment_method: 'Transfer',
         status: 'completed',
         created_at: '2024-01-15 12:00:00',
      },
      {
         id: 4,
         invoice_number: 'INV-2024-004',
         cashier_name: 'Admin',
         total: 50000,
         payment_method: 'Debit',
         status: 'refunded',
         created_at: '2024-01-15 13:30:00',
      },
      {
         id: 5,
         invoice_number: 'INV-2024-005',
         cashier_name: 'Kasir 2',
         total: 125000,
         payment_method: 'Tunai',
         status: 'completed',
         created_at: '2024-01-15 14:45:00',
      },
   ];

   const columns: Column<Transaction>[] = [
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
         key: 'invoice_number',
         label: 'No. Invoice',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">{row.invoice_number}</span>
         ),
      },
      {
         key: 'cashier_name',
         label: 'Kasir',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-900">{row.cashier_name}</span>
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
         key: 'payment_method',
         label: 'Pembayaran',
         sortable: false,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.payment_method}</span>
         ),
      },
      {
         key: 'status',
         label: 'Status',
         sortable: true,
         render: (_, row) => (
            row.status === 'completed' ? (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                  Selesai
               </span>
            ) : row.status === 'refunded' ? (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                  Refund
               </span>
            ) : (
               <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                  Pending
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
         width: '8rem',
         className: 'whitespace-nowrap',
         render: (_, row) => (
            <div className="flex items-center gap-2">
               <Link
                  href={`/admin/pos/transactions/${row.id}`}
                  className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2a4061] text-white hover:bg-[#1e2f47] rounded-lg transition-colors text-xs font-medium cursor-pointer"
               >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Detail</span>
               </Link>
               <button
                  className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
               >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Cetak</span>
               </button>
            </div>
         ),
      },
   ];

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>
            <p className="text-gray-500 mt-1">Riwayat transaksi penjualan</p>
         </div>

         <DataTable
            data={transactions}
            columns={columns}
            itemsPerPage={10}
            searchPlaceholder="Cari transaksi..."
            emptyMessage="Belum ada transaksi"
            emptyIcon={<Receipt className="w-16 h-16 text-gray-300 mx-auto" />}
            isLoading={false}
            getRowId={(row) => row.id}
         />
      </div>
   );
}
