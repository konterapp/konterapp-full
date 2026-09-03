'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Zap, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { getPpobTransactionTypes, deletePpobTransactionType, PpobTransactionType } from '@/lib/api/app/ppob-transaction';

export default function PpobTransactionTypesPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [types, setTypes] = useState<PpobTransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: PpobTransactionType | null; isLoading: boolean }>({
    isOpen: false,
    type: null,
    isLoading: false,
  });

  const fetchTypes = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await getPpobTransactionTypes();
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

  const handleDeleteClick = (type: PpobTransactionType) => {
    setDeleteModal({ isOpen: true, type, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.type) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await deletePpobTransactionType(deleteModal.type.uuid);
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

  const columns: Column<PpobTransactionType>[] = [
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
          {hasPermission('pos.ppob-transaction-type.update') && (
            <Link
              href={`/app/pos/ppob-transaction-types/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {hasPermission('pos.ppob-transaction-type.delete') && (
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
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.cash_direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.cash_direction === 'in' ? 'Kas Masuk' : 'Kas Keluar'}
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

  // Tampilan kartu untuk layar kecil -- sebagai tabel, kolom Arah Kas &
  // Status terpotong di HP dan tombol aksinya cuma ikon bertooltip yang tidak
  // pernah muncul di layar sentuh.
  const renderTypeCard = (row: PpobTransactionType) => (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        {/* min-w-0 wajib: tanpa itu flex child menolak menyusut & nama jenis
            yang panjang bikin overflow horizontal. */}
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">{row.name}</p>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${
            row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>

      {/* Pemetaan arah kas di halaman PPOB ini kebalikan dari halaman Agen
          Bank ('in' = Kas Masuk); ikuti yang dipakai kolom tabelnya sendiri. */}
      <span
        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
          row.cash_direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {row.cash_direction === 'in' ? 'Kas Masuk' : 'Kas Keluar'}
      </span>

      {(hasPermission('pos.ppob-transaction-type.update') ||
        hasPermission('pos.ppob-transaction-type.delete')) && (
        <div className="flex items-center gap-2 border-t border-gray-100 pt-2.5">
          {hasPermission('pos.ppob-transaction-type.update') && (
            <Link
              href={`/app/pos/ppob-transaction-types/${row.uuid}/edit`}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#EBC170] px-2 text-xs font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer"
            >
              Edit
            </Link>
          )}
          {hasPermission('pos.ppob-transaction-type.delete') && (
            <button
              type="button"
              onClick={() => handleDeleteClick(row)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-red-500 px-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Desktop: tautan kembali berteks di atas judul, seperti semula. */}
      <Link
        href="/app/pos/ppob-transactions"
        className="hidden sm:inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Kembali ke Server Pulsa/PPOB</span>
      </Link>

      {/* Mobile: judul & tombol ditumpuk. Sebelumnya keduanya dipaksa sebaris
          sehingga judul pecah dua baris, deskripsinya menyempit jadi kolom
          kurus, dan label tombol pecah jadi tiga baris. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-1 sm:block">
          <Link
            href="/app/pos/ppob-transactions"
            aria-label="Kembali ke Server Pulsa/PPOB"
            className="sm:hidden -ml-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-[#142D52]">Jenis Transaksi PPOB</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola jenis transaksi Server Pulsa/PPOB (pulsa, token listrik, dst).</p>
          </div>
        </div>
        {hasPermission('pos.ppob-transaction-type.create') && (
          <Link
            href="/app/pos/ppob-transaction-types/create"
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5 shrink-0" />
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
        emptyIcon={<Zap className="w-16 h-16 text-gray-300 mx-auto" />}
        isLoading={isLoading}
        getRowId={(row) => row.uuid}
        renderMobileCard={renderTypeCard}
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
