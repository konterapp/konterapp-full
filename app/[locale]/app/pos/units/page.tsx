'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Scale, Plus, Edit, Trash2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Unit {
  uuid: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

export default function UnitsPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [units, setUnits] = useState<Unit[]>([]);
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; unit: Unit | null; isLoading: boolean }>({
    isOpen: false,
    unit: null,
    isLoading: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const fetchUnits = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (sortBy) {
        params.append('sort_by', sortBy);
      }

      if (sortOrder) {
        params.append('sort_order', sortOrder);
      }

      const response = await fetch(`/api/app/pos/units?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setUnits(result.data.data || []);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setTotalItems(result.data.pagination?.total || 0);
      } else {
        setError(result.message || 'Gagal memuat data satuan');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchUnits(currentPage);
  }, [currentPage, fetchUnits]);

  const handleDeleteClick = (unit: Unit) => {
    setDeleteModal({
      isOpen: true,
      unit,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.unit) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/app/pos/units/${deleteModal.unit.uuid}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Satuan berhasil dihapus');
        setDeleteModal({ isOpen: false, unit: null, isLoading: false });
        fetchUnits(currentPage);
      } else {
        toast.error(result.message || 'Gagal menghapus satuan');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, unit: null, isLoading: false });
  };

  // Tampilan kartu untuk layar kecil. Aksinya pakai label teks, bukan ikon
  // bertooltip seperti versi tabel -- di layar sentuh tidak ada hover jadi
  // tooltipnya tidak pernah terbaca.
  const renderUnitCard = (row: Unit) => (
    <div className="space-y-2.5">
      {/* min-w-0 wajib: tanpa itu flex child menolak menyusut & teks panjang
          bikin overflow horizontal. */}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{row.name}</p>
        <p className="truncate text-xs text-gray-500">
          {row.description || <span className="text-gray-400">Tanpa deskripsi</span>}
        </p>
      </div>

      {(hasPermission('pos.unit.update') || hasPermission('pos.unit.delete')) && (
        <div className="flex gap-2 border-t border-gray-100 pt-2.5">
          {hasPermission('pos.unit.update') && (
            <Link
              href={`/app/pos/units/${row.uuid}/edit`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#EBC170] text-xs font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] cursor-pointer"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Link>
          )}
          {hasPermission('pos.unit.delete') && (
            <button
              onClick={() => handleDeleteClick(row)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );

  const columns: Column<Unit>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = units.findIndex(c => c.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {hasPermission('pos.unit.update') && (
            <Link
              href={`/app/pos/units/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit</span>
            </Link>
          )}
          {hasPermission('pos.unit.delete') && (
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
      label: 'Nama Satuan',
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      width: '20rem',
      render: (_, row) => (
        <p className="text-sm font-medium text-gray-900">{row.name}</p>
      ),
    },
    {
      key: 'description',
      label: 'Deskripsi',
      sortable: false,
      render: (_, row) => (
        <p className="text-sm text-gray-600">
          {row.description || <span className="text-gray-400">-</span>}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Di mobile judul & tombol ditumpuk; dipaksa sebaris membuat label
          tombol pecah jadi beberapa baris. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#142D52]">Satuan Produk</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola satuan untuk pemilihan pada form produk POS.</p>
        </div>
        {hasPermission('pos.unit.create') && (
          <Link
            href="/app/pos/units/create"
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span>Tambah Satuan</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={units}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari satuan..."
        emptyMessage="Tidak ada satuan ditemukan"
        emptyIcon={<Scale className="w-16 h-16 text-gray-300 mx-auto" />}
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
        renderMobileCard={renderUnitCard}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Hapus Satuan"
        message={`Apakah Anda yakin ingin menghapus satuan "${deleteModal.unit?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
