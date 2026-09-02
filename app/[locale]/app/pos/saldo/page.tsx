'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { Wallet, Plus, Eye, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { SaldoAccount, deleteSaldoAccount, moveSaldoAccount } from '@/lib/api/app/saldo';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function SaldoPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [accounts, setAccounts] = useState<SaldoAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('sort_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; account: SaldoAccount | null; isLoading: boolean }>({
    isOpen: false,
    account: null,
    isLoading: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAccounts = useCallback(async (page: number) => {
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

      const response = await fetch(`/api/app/pos/saldo?${params}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setAccounts(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        }
      } else {
        setError(result.message || 'Gagal memuat data saldo');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchAccounts(currentPage);
  }, [currentPage, fetchAccounts]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleDeleteClick = (account: SaldoAccount) => {
    setDeleteModal({ isOpen: true, account, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.account) return;
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await deleteSaldoAccount(deleteModal.account.uuid);
      if (result.status === 'success') {
        toast.success('Akun saldo berhasil dihapus');
        setDeleteModal({ isOpen: false, account: null, isLoading: false });
        fetchAccounts(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus akun saldo');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      toast.error('Gagal menghapus akun saldo. Silakan coba lagi.');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, account: null, isLoading: false });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleMove = async (account: SaldoAccount, direction: 'up' | 'down') => {
    try {
      const result = await moveSaldoAccount(account.uuid, direction);
      if (result.status === 'success') {
        fetchAccounts(currentPage);
      } else {
        toast.error(result.message || 'Gagal mengubah urutan');
      }
    } catch {
      toast.error('Gagal mengubah urutan. Silakan coba lagi.');
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      cash: { color: 'bg-green-100 text-green-800', label: 'Tunai' },
      bank: { color: 'bg-blue-100 text-blue-800', label: 'Bank' },
      e_wallet: { color: 'bg-orange-100 text-orange-800', label: 'E-Wallet' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Lainnya' },
    };
    const config = badges[type] || badges.other;
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>{config.label}</span>;
  };

  const columns: Column<SaldoAccount>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = accounts.findIndex(a => a.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => {
        const index = accounts.findIndex(a => a.uuid === row.uuid);
        return (
        <div className="flex items-center gap-2">
          {hasPermission('pos.saldo.update') && (
            <>
              <button
                type="button"
                onClick={() => handleMove(row, 'up')}
                disabled={index === 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Naikkan urutan"
              >
                <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(row, 'down')}
                disabled={index === accounts.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Turunkan urutan"
              >
                <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </>
          )}
          <Link
            href={`/app/pos/saldo/${row.uuid}`}
            className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Detail</span>
          </Link>
          {hasPermission('pos.saldo.update') && (
            <Link
              href={`/app/pos/saldo/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {hasPermission('pos.saldo.delete') && (
            <button
              onClick={() => handleDeleteClick(row)}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Hapus</span>
            </button>
          )}
        </div>
        );
      },
    },
    {
      key: 'code',
      label: 'Kode',
      sortable: true,
      sortValue: (row) => row.code,
      render: (_, row) => <span className="text-sm font-mono text-gray-700">{row.code}</span>,
    },
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
      sortValue: (row) => row.name,
      render: (_, row) => <span className="text-sm font-medium text-gray-900">{row.name}</span>,
    },
    {
      key: 'type',
      label: 'Tipe',
      sortable: true,
      sortValue: (row) => row.type,
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-1">
          {getTypeBadge(row.type)}
          {row.is_bank_agent && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Agen Bank</span>
          )}
          {row.is_ppob_server && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Server PPOB</span>
          )}
        </div>
      ),
    },
    {
      key: 'balance',
      label: 'Saldo',
      sortable: true,
      sortValue: (row) => row.balance,
      render: (_, row) => <span className="text-sm font-semibold text-gray-900">{formatCurrency(row.balance)}</span>,
    },
    {
      key: 'is_payment_method',
      label: 'Metode Bayar?',
      sortable: false,
      render: (_, row) => (
        row.is_payment_method ? (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Ya</span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-500">Tidak</span>
        )
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      sortValue: (row) => row.is_active ? 'Active' : 'Inactive',
      render: (_, row) => (
        row.is_active ? (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aktif</span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Nonaktif</span>
        )
      ),
    },
  ];

  // Tampilan kartu untuk layar kecil -- tabel ini punya 8 kolom, kalau
  // dipaksa jadi tabel di HP ujungnya harus digeser-geser ke samping dan
  // kolom Kode/Nama/Tipe tidak kelihatan sama sekali.
  const renderSaldoCard = (row: SaldoAccount) => {
    const index = accounts.findIndex((a) => a.uuid === row.uuid);
    const canUpdate = hasPermission('pos.saldo.update');
    const canDelete = hasPermission('pos.saldo.delete');

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {/* min-w-0 wajib: tanpa itu flex child menolak menyusut & nama akun
              yang panjang bikin overflow horizontal. */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{row.name}</p>
            <p className="truncate font-mono text-xs text-gray-500">{row.code}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
              row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {row.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        <p className="text-lg font-bold text-gray-900">{formatCurrency(row.balance)}</p>

        <div className="flex flex-wrap gap-1.5">
          {getTypeBadge(row.type)}
          {row.is_bank_agent && (
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-800">Agen Bank</span>
          )}
          {row.is_ppob_server && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Server PPOB</span>
          )}
          {row.is_payment_method && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Metode Bayar</span>
          )}
        </div>

        {/* Tombol aksi di mobile wajib berlabel teks & min-h-11 (44px):
            di layar sentuh tidak ada hover, jadi tooltip ikon tidak terbaca. */}
        <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
          <Link
            href={`/app/pos/saldo/${row.uuid}`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#EBC170] px-3 text-sm font-medium text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            Detail
          </Link>
          {canUpdate && (
            <Link
              href={`/app/pos/saldo/${row.uuid}/edit`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-600 cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => handleDeleteClick(row)}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 text-sm font-medium text-white transition-colors hover:bg-red-600 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </button>
          )}
          {canUpdate && (
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMove(row, 'up')}
                disabled={index === 0}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowUp className="h-4 w-4" />
                Naikkan
              </button>
              <button
                type="button"
                onClick={() => handleMove(row, 'down')}
                disabled={index === accounts.length - 1}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowDown className="h-4 w-4" />
                Turunkan
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Di mobile judul & tombol ditumpuk: dulu dipaksa sebaris sehingga label
          tombol pecah jadi tiga baris dan menghimpit judul. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#142D52] flex items-center gap-2">
            <Wallet className="h-6 w-6 shrink-0" />
            Saldo
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola akun uang konter (Cash, Dana, Gopay, BRI, dst) & cocokkan dengan transaksi</p>
        </div>
        {hasPermission('pos.saldo.create') && (
          <Link
            href="/app/pos/saldo/create"
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] px-4 py-2 transition-colors cursor-pointer font-semibold"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>Tambah Akun Saldo</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={accounts}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari akun saldo..."
        emptyMessage="Belum ada akun saldo"
        emptyIcon={<Wallet className="w-16 h-16 text-gray-300 mx-auto" />}
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
        renderMobileCard={renderSaldoCard}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Akun Saldo"
        message={`Apakah Anda yakin ingin menghapus akun saldo "${deleteModal.account?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
