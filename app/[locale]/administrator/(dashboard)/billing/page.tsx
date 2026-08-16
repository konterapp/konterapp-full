'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { ReceiptText, Eye } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { getBillingInvoicesList, AdminBillingInvoice } from '@/lib/api/administrator/billing';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const statusBadge: Record<string, { label: string; className: string }> = {
  paid: { label: 'Lunas', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Menunggu', className: 'bg-amber-100 text-amber-700' },
  expired: { label: 'Kedaluwarsa', className: 'bg-gray-100 text-gray-600' },
  failed: { label: 'Gagal', className: 'bg-red-100 text-red-700' },
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<AdminBillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchInvoices = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getBillingInvoicesList(
        page,
        itemsPerPage,
        debouncedSearch,
        statusFilter,
        sortBy,
        sortOrder
      );

      if (response.data) {
        setInvoices(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.last_page);
          setTotalItems(response.data.meta.total);
        }
      } else if (response.status === 'error') {
        setError(response.message || 'Gagal memuat daftar transaksi billing');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, fetchInvoices]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const columns: Column<AdminBillingInvoice>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = invoices.findIndex((i) => i.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'provider_invoice_id',
      label: 'Kode Invoice',
      sortable: true,
      sortValue: (row) => row.provider_invoice_id.toLowerCase(),
      width: '12rem',
      render: (_, row) => (
        <span className="text-sm font-mono text-gray-700">{row.provider_invoice_id}</span>
      ),
    },
    {
      key: 'company',
      label: 'Perusahaan',
      sortable: false,
      render: (_, row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{row.company?.name}</p>
          {row.company?.code && (
            <p className="text-xs text-gray-500 font-mono">{row.company.code}</p>
          )}
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Paket',
      sortable: false,
      width: '10rem',
      render: (_, row) => <span className="text-sm text-gray-700">{row.plan.name}</span>,
    },
    {
      key: 'amount',
      label: 'Nominal',
      sortable: true,
      sortValue: (row) => row.amount,
      width: '9rem',
      render: (_, row) => (
        <span className="text-sm font-semibold text-gray-900">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortValue: (row) => row.status,
      width: '8rem',
      render: (_, row) => {
        const badge = statusBadge[row.status] ?? { label: row.status, className: 'bg-gray-100 text-gray-600' };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Tanggal',
      sortable: true,
      sortValue: (row) => new Date(row.created_at).getTime(),
      width: '9rem',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      width: '6rem',
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <Link
          href={`/administrator/billing/${row.uuid}`}
          className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Detail
          </span>
        </Link>
      ),
    },
  ];

  const filterComponent = (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Status Transaksi</label>
      <select
        value={statusFilter}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white text-sm cursor-pointer"
      >
        <option value="">Semua Status</option>
        <option value="pending">Menunggu</option>
        <option value="paid">Lunas</option>
        <option value="expired">Kedaluwarsa</option>
        <option value="failed">Gagal</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Transaksi Billing</h1>
        <p className="text-gray-600 mt-1">Riwayat transaksi pembayaran langganan semua perusahaan.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <DataTable
        data={invoices}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari invoice / perusahaan..."
        emptyMessage="Belum ada transaksi billing"
        emptyIcon={<ReceiptText className="w-16 h-16 text-gray-300 mx-auto" />}
        filterComponent={filterComponent}
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
