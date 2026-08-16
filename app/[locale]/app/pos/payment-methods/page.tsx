'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable, { Column } from '../../_components/DataTable';
import ConfirmModal from '../../_components/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface PaymentMethod {
  uuid: string;
  code: string;
  name: string;
  type: string;
  account_number?: string | null;
  account_name?: string | null;
  is_active: boolean;
}

export default function PaymentMethodsPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; method: PaymentMethod | null; isLoading: boolean }>({
    isOpen: false,
    method: null,
    isLoading: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPaymentMethods = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
        search: debouncedSearch,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(`/api/app/pos/payment-methods?${params}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setPaymentMethods(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        }
      } else {
        setError(result.message || 'Gagal memuat data metode pembayaran');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchPaymentMethods(currentPage);
  }, [currentPage, fetchPaymentMethods]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleDeleteClick = (method: PaymentMethod) => {
    setDeleteModal({ isOpen: true, method, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.method) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/app/pos/payment-methods/${deleteModal.method.uuid}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Metode pembayaran berhasil dihapus');
        setDeleteModal({ isOpen: false, method: null, isLoading: false });
        fetchPaymentMethods(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus metode pembayaran');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      toast.error('Gagal menghapus metode pembayaran. Silakan coba lagi.');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, method: null, isLoading: false });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      cash: { color: 'bg-green-100 text-green-800', label: 'Tunai' },
      bank_transfer: { color: 'bg-blue-100 text-blue-800', label: 'Transfer Bank' },
      qris: { color: 'bg-purple-100 text-purple-800', label: 'QRIS' },
      e_wallet: { color: 'bg-orange-100 text-orange-800', label: 'E-Wallet' },
      credit_card: { color: 'bg-indigo-100 text-indigo-800', label: 'Kartu Kredit' },
      debit_card: { color: 'bg-cyan-100 text-cyan-800', label: 'Kartu Debit' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Lainnya' },
    };
    const config = badges[type] || badges.other;
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>{config.label}</span>;
  };

  const columns: Column<PaymentMethod>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = paymentMethods.findIndex(m => m.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'code',
      label: 'Kode',
      sortable: true,
      sortValue: (row) => row.code,
      render: (_, row) => (
        <span className="text-sm font-mono text-gray-700">{row.code}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
      sortValue: (row) => row.name,
      render: (_, row) => (
        <span className="text-sm font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'type',
      label: 'Tipe',
      sortable: true,
      sortValue: (row) => row.type,
      render: (_, row) => getTypeBadge(row.type),
    },
    {
      key: 'account_number',
      label: 'No. Rekening/Akun',
      sortable: false,
      render: (_, row) => (
        <span className="text-sm text-gray-600">{row.account_number || '-'}</span>
      ),
    },
    {
      key: 'account_name',
      label: 'Nama Akun',
      sortable: false,
      render: (_, row) => (
        <span className="text-sm text-gray-600">{row.account_name || '-'}</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      sortValue: (row) => row.is_active ? 'Active' : 'Inactive',
      render: (_, row) => (
        row.is_active ? (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Aktif
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Nonaktif
          </span>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {hasPermission('admin.pos.payment-method.update') && (
            <Link
              href={`/app/pos/payment-methods/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {hasPermission('admin.pos.payment-method.delete') && (
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
          <h1 className="text-2xl font-bold text-[#142D52] flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Metode Pembayaran
          </h1>
          <p className="text-gray-600 mt-1">Kelola metode pembayaran untuk transaksi</p>
        </div>
        {hasPermission('admin.pos.payment-method.create') && (
          <Link
            href="/app/pos/payment-methods/create"
            className="flex items-center space-x-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] px-4 py-2 transition-colors cursor-pointer font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Metode Pembayaran</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={paymentMethods}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari metode pembayaran..."
        emptyMessage="Belum ada metode pembayaran"
        emptyIcon={<CreditCard className="w-16 h-16 text-gray-300 mx-auto" />}
        serverSide={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        isLoading={isLoading}
        getRowId={(row) => row.uuid}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Metode Pembayaran"
        message={`Apakah Anda yakin ingin menghapus metode pembayaran "${deleteModal.method?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
