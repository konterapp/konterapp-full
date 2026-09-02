'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Landmark, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { getBankAgentTransactionTypes, deleteBankAgentTransactionType, BankAgentTransactionType } from '@/lib/api/app/bank-agent-transaction';

export default function BankAgentTransactionTypesPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [types, setTypes] = useState<BankAgentTransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: BankAgentTransactionType | null; isLoading: boolean }>({
    isOpen: false,
    type: null,
    isLoading: false,
  });

  const fetchTypes = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await getBankAgentTransactionTypes();
      if (result.status === 'success') {
        setTypes(result.data || []);
      } else {
        setError('Gagal memuat data jenis transaksi');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleDeleteClick = (type: BankAgentTransactionType) => {
    setDeleteModal({ isOpen: true, type, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.type) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await deleteBankAgentTransactionType(deleteModal.type.uuid);
      if (result.status === 'success') {
        toast.success('Jenis transaksi berhasil dihapus');
        setDeleteModal({ isOpen: false, type: null, isLoading: false });
        fetchTypes();
      } else {
        toast.error(result.message || 'Gagal menghapus jenis transaksi');
        setDeleteModal((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, type: null, isLoading: false });
  };

  const columns: Column<BankAgentTransactionType>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = types.findIndex((t) => t.uuid === row.uuid);
        return <span className="text-sm text-gray-600">{index + 1}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {hasPermission('pos.bank-agent-transaction-type.update') && (
            <Link
              href={`/app/pos/bank-agent-transaction-types/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {hasPermission('pos.bank-agent-transaction-type.delete') && (
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
    {
      key: 'name',
      label: 'Nama Jenis Transaksi',
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      render: (_, row) => <p className="text-sm font-medium text-gray-900">{row.name}</p>,
    },
    {
      key: 'cash_direction',
      label: 'Arah Kas',
      sortable: false,
      render: (_, row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.cash_direction === 'in' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {row.cash_direction === 'in' ? 'Kas Keluar' : 'Kas Masuk'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: false,
      render: (_, row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/pos/bank-agent-transactions"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Agen Bank</span>
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">Jenis Transaksi Agen Bank</h1>
          <p className="text-gray-600 mt-1">Kelola jenis transaksi Agen Bank (setor/tarik tunai, transfer, bayar BPJS/listrik, dst).</p>
        </div>
        {hasPermission('pos.bank-agent-transaction-type.create') && (
          <Link
            href="/app/pos/bank-agent-transaction-types/create"
            className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Jenis Transaksi</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <DataTable
        data={types}
        columns={columns}
        itemsPerPage={20}
        searchPlaceholder="Cari jenis transaksi..."
        emptyMessage="Belum ada jenis transaksi"
        emptyIcon={<Landmark className="w-16 h-16 text-gray-300 mx-auto" />}
        isLoading={isLoading}
        getRowId={(row) => row.uuid}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Jenis Transaksi"
        message={`Apakah Anda yakin ingin menghapus jenis transaksi "${deleteModal.type?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
