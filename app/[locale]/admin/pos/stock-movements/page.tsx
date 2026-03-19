'use client';

import { useState } from 'react';
import { Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';

interface StockMovement {
   id: number;
   product_name: string;
   type: string;
   quantity: number;
   reference: string;
   date: string;
   notes: string;
}

export default function StockMovementsPage() {
   // Sample data
   const movements: StockMovement[] = [
      {
         id: 1,
         product_name: 'Indomie Goreng',
         type: 'in',
         quantity: 100,
         reference: 'PO-2024-001',
         date: '2024-01-15 10:30:00',
         notes: 'Pembelian stok',
      },
      {
         id: 2,
         product_name: 'Indomie Goreng',
         type: 'out',
         quantity: 5,
         reference: 'INV-2024-001',
         date: '2024-01-15 11:00:00',
         notes: 'Penjualan',
      },
      {
         id: 3,
         product_name: 'Aqua 600ml',
         type: 'in',
         quantity: 50,
         reference: 'PO-2024-002',
         date: '2024-01-15 14:00:00',
         notes: 'Pembelian stok',
      },
      {
         id: 4,
         product_name: 'Teh Botol',
         type: 'out',
         quantity: 10,
         reference: 'INV-2024-002',
         date: '2024-01-15 15:30:00',
         notes: 'Penjualan',
      },
      {
         id: 5,
         product_name: 'Kopi Hitam',
         type: 'adjustment',
         quantity: -2,
         reference: 'ADJ-2024-001',
         date: '2024-01-16 09:00:00',
         notes: 'Penyesuaian stok - rusak',
      },
   ];

   const columns: Column<StockMovement>[] = [
      {
         key: 'no',
         label: 'No',
         sortable: false,
         width: '4rem',
         render: (_, row) => {
            const index = movements.findIndex(m => m.id === row.id);
            return <span className="text-sm text-gray-600">{index + 1}</span>;
         },
      },
      {
         key: 'product_name',
         label: 'Produk',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm font-medium text-gray-900">{row.product_name}</span>
         ),
      },
      {
         key: 'type',
         label: 'Tipe',
         sortable: true,
         render: (_, row) => (
            row.type === 'in' ? (
               <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Masuk</span>
               </div>
            ) : row.type === 'out' ? (
               <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Keluar</span>
               </div>
            ) : (
               <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Penyesuaian</span>
               </div>
            )
         ),
      },
      {
         key: 'quantity',
         label: 'Jumlah',
         sortable: true,
         render: (_, row) => (
            <span className={`text-sm font-medium ${row.quantity > 0 ? 'text-green-700' : 'text-red-700'}`}>
               {row.quantity > 0 ? '+' : ''}{row.quantity}
            </span>
         ),
      },
      {
         key: 'reference',
         label: 'Referensi',
         sortable: false,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.reference}</span>
         ),
      },
      {
         key: 'date',
         label: 'Tanggal',
         sortable: true,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.date}</span>
         ),
      },
      {
         key: 'notes',
         label: 'Keterangan',
         sortable: false,
         render: (_, row) => (
            <span className="text-sm text-gray-600">{row.notes}</span>
         ),
      },
   ];

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Stok</h1>
            <p className="text-gray-500 mt-1">Riwayat pergerakan stok</p>
         </div>

         <DataTable
            data={movements}
            columns={columns}
            itemsPerPage={10}
            searchPlaceholder="Cari riwayat stok..."
            emptyMessage="Belum ada riwayat pergerakan stok"
            emptyIcon={<Package className="w-16 h-16 text-gray-300 mx-auto" />}
            isLoading={false}
            getRowId={(row) => row.id}
         />
      </div>
   );
}
