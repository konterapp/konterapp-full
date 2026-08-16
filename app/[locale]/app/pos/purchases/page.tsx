'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { ShoppingCart, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Purchase {
  uuid: string;
  purchase_number: string;
  purchase_date: string;
  total_amount: number;
  payment_status: string;
  branch?: {
    uuid: string;
    name: string;
  } | null;
  supplier?: {
    uuid: string;
    name: string;
    code?: string | null;
  } | null;
}

export default function PurchasesPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; purchase: Purchase | null; isLoading: boolean }>({
    isOpen: false,
    purchase: null,
    isLoading: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPurchases = useCallback(async (page: number) => {
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

      const response = await fetch(`/api/app/pos/purchases?${params}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setPurchases(result.data.data || []);
        if (result.data.pagination) {
          setTotalPages(result.data.pagination.totalPages);
          setTotalItems(result.data.pagination.total);
        }
      } else if (result.status === 'error') {
        setError(result.message || 'Gagal memuat data pembelian');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchPurchases(currentPage);
  }, [fetchPurchases, currentPage]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleDeleteClick = (purchase: Purchase) => {
    setDeleteModal({ isOpen: true, purchase, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.purchase) return;

    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/app/pos/purchases/${deleteModal.purchase.uuid}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Pembelian berhasil di-void');
        setDeleteModal({ isOpen: false, purchase: null, isLoading: false });
        fetchPurchases(currentPage);
      } else {
        toast.error(result.message || 'Gagal void pembelian');
        setDeleteModal((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, purchase: null, isLoading: false });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      void: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending: 'Belum Dibayar',
      partial: 'Dibayar Sebagian',
      paid: 'Lunas',
      void: 'Void',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const columns: Column<Purchase>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = purchases.findIndex((purchase) => purchase.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'purchase_number',
      label: 'No. Pembelian',
      sortable: true,
      sortValue: (row) => row.purchase_number,
      width: '12rem',
      render: (_, row) => (
        <p className="text-sm font-medium text-gray-900">{row.purchase_number}</p>
      ),
    },
    {
      key: 'purchase_date',
      label: 'Tanggal',
      sortable: true,
      sortValue: (row) => row.purchase_date,
      width: '10rem',
      render: (_, row) => (
        <p className="text-sm text-gray-600">{formatDate(row.purchase_date)}</p>
      ),
    },
    {
      key: 'branch',
      label: 'Cabang',
      sortable: false,
      width: '12rem',
      render: (_, row) => (
        <p className="text-sm text-gray-900">{row.branch?.name || '-'}</p>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      sortable: false,
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.supplier?.name || 'Tanpa Supplier'}</p>
          <p className="text-xs text-gray-500">{row.supplier?.code || ''}</p>
        </div>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total',
      sortable: true,
      sortValue: (row) => row.total_amount,
      width: '12rem',
      render: (_, row) => (
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(row.total_amount)}</p>
      ),
    },
    {
      key: 'payment_status',
      label: 'Status',
      sortable: false,
      width: '12rem',
      render: (_, row) => getStatusBadge(row.payment_status),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/app/pos/purchases/${row.uuid}`}
            className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Detail</span>
          </Link>
          {row.payment_status === 'draft' && hasPermission('pos.purchase.create') && (
            <Link
              href={`/app/pos/purchases/${row.uuid}/edit`}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Edit Draft</span>
            </Link>
          )}
          {hasPermission('pos.purchase.delete') && row.payment_status !== 'void' && (
            <button
              onClick={() => handleDeleteClick(row)}
              className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Void</span>
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
          <h1 className="text-2xl font-bold text-[#142D52]">Pembelian / Stock In</h1>
          <p className="text-gray-600 mt-1">Kelola stock in pembelian dengan atau tanpa supplier.</p>
        </div>
        {hasPermission('pos.purchase.create') && (
          <Link
            href="/app/pos/purchases/create"
            className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Pembelian</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <DataTable
        data={purchases}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari pembelian..."
        emptyMessage="Tidak ada pembelian ditemukan"
        emptyIcon={<ShoppingCart className="w-16 h-16 text-gray-300 mx-auto" />}
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

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Void Pembelian"
        message={
          deleteModal.purchase?.payment_status === 'draft'
            ? `Apakah Anda yakin ingin void draft "${deleteModal.purchase?.purchase_number}"?`
            : `Apakah Anda yakin ingin void pembelian "${deleteModal.purchase?.purchase_number}"? Stock yang telah masuk akan dikurangi kembali.`
        }
        confirmText="Ya, Void"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
