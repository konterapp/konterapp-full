'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Percent, BadgeCheck } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { getCouponsList, deleteCoupon, updateCoupon, Coupon } from '@/lib/api/administrator/coupon';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CouponFormModal from './_components/CouponFormModal';
import { useToast } from '@/components/toast/ToastContainer';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function CouponsPage() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
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
  const [formModal, setFormModal] = useState<{ isOpen: boolean; couponUuid?: string }>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; coupon: Coupon | null; isLoading: boolean }>({
    isOpen: false,
    coupon: null,
    isLoading: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCoupons = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getCouponsList(
        page,
        itemsPerPage,
        debouncedSearch,
        statusFilter,
        sortBy,
        sortOrder
      );

      if (response.data) {
        setCoupons(response.data.data);
        if (response.data.meta) {
          setTotalPages(response.data.meta.last_page);
          setTotalItems(response.data.meta.total);
        }
      } else if (response.status === 'error') {
        setError(response.message || 'Gagal memuat daftar kupon');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCoupons(currentPage);
  }, [currentPage, fetchCoupons]);

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleEditClick = (coupon: Coupon) => {
    setFormModal({ isOpen: true, couponUuid: coupon.uuid });
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const response = await updateCoupon(coupon.uuid, { is_active: !coupon.is_active });
      if (response.status === 'success') {
        toast.success(coupon.is_active ? 'Kupon dinonaktifkan' : 'Kupon diaktifkan');
        fetchCoupons(currentPage);
      } else {
        toast.error(response.message || 'Gagal mengubah status kupon');
      }
    } catch {
      toast.error('Terjadi kesalahan, silakan coba lagi');
    }
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setDeleteModal({ isOpen: true, coupon, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.coupon) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await deleteCoupon(deleteModal.coupon.uuid);
      if (response.status === 'success') {
        toast.success('Kupon berhasil dihapus');
        setDeleteModal({ isOpen: false, coupon: null, isLoading: false });
        fetchCoupons(currentPage);
      } else {
        toast.error(response.message || 'Gagal menghapus kupon');
        setDeleteModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch {
      toast.error('Terjadi kesalahan, silakan coba lagi');
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const discountLabel = (row: Coupon) => {
    const percent = `${row.discount_percent}%`;
    return row.max_discount != null ? `${percent} (maks ${formatCurrency(row.max_discount)})` : percent;
  };

  const isExpired = (row: Coupon) => row.expires_at != null && new Date(row.expires_at) < new Date();
  const isNotStarted = (row: Coupon) => row.starts_at != null && new Date(row.starts_at) > new Date();

  const statusInfo = (row: Coupon): { label: string; className: string } => {
    if (!row.is_active) return { label: 'Nonaktif', className: 'bg-gray-100 text-gray-600' };
    if (isExpired(row)) return { label: 'Kedaluwarsa', className: 'bg-red-100 text-red-700' };
    if (isNotStarted(row)) return { label: 'Belum Aktif', className: 'bg-amber-100 text-amber-700' };
    return { label: 'Aktif', className: 'bg-green-100 text-green-700' };
  };

  const columns: Column<Coupon>[] = [
    {
      key: 'no',
      label: 'No',
      sortable: false,
      width: '4rem',
      render: (_, row) => {
        const index = coupons.findIndex((i) => i.uuid === row.uuid);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
        return <span className="text-sm text-gray-600">{rowNumber}</span>;
      },
    },
    {
      key: 'code',
      label: 'Kode',
      sortable: true,
      sortValue: (row) => row.code.toLowerCase(),
      width: '10rem',
      render: (_, row) => <span className="text-sm font-mono font-semibold text-[#142D52]">{row.code}</span>,
    },
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
      sortValue: (row) => row.name.toLowerCase(),
      render: (_, row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.description && <p className="text-xs text-gray-500 truncate max-w-[20rem]">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Paket',
      sortable: false,
      width: '8rem',
      render: (_, row) => {
        const planLabel = row.plan_code === 'monthly' ? 'Bulanan' : row.plan_code === 'yearly' ? 'Tahunan' : 'Semua';
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.plan_code ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            {planLabel}
          </span>
        );
      },
    },
    {
      key: 'discount_percent',
      label: 'Diskon',
      sortable: true,
      sortValue: (row) => row.discount_percent,
      width: '11rem',
      render: (_, row) => (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
          <Percent className="w-3.5 h-3.5" />
          {discountLabel(row)}
        </span>
      ),
    },
    {
      key: 'used_count',
      label: 'Pemakaian',
      sortable: true,
      sortValue: (row) => row.used_count,
      width: '7rem',
      render: (_, row) => (
        <span className="text-sm text-gray-700">
          {row.used_count}
          {row.usage_limit != null && <span className="text-gray-400"> / {row.usage_limit}</span>}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      width: '8rem',
      render: (_, row) => {
        const badge = statusInfo(row);
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'period',
      label: 'Berlaku',
      sortable: false,
      width: '12rem',
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.starts_at)} &ndash; {formatDate(row.expires_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      width: '10rem',
      className: 'whitespace-nowrap',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Edit
            </span>
          </button>
          <button
            onClick={() => handleToggleActive(row)}
            className={`relative group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium cursor-pointer ${
              row.is_active
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            {row.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
            </span>
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Hapus
            </span>
          </button>
        </div>
      ),
    },
  ];

  const filterComponent = (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <select
        value={statusFilter}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white text-sm cursor-pointer"
      >
        <option value="">Semua Status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#142D52]">Kelola Kupon</h1>
          <p className="text-gray-600 mt-1">Kupon diskon untuk pembayaran langganan paket berbayar.</p>
        </div>
        <button
          onClick={() => setFormModal({ isOpen: true })}
          className="flex items-center space-x-2 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Kupon</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BadgeCheck className="w-4 h-4 text-[#142D52]" />
          <span>
            Kode kupon dimasukkan tenant di halaman Langganan sebelum membayar. Diskon otomatis
            terpotong dari total tagihan.
          </span>
        </div>
      </div>

      <DataTable
        data={coupons}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari kode / nama kupon..."
        emptyMessage="Belum ada kupon"
        emptyIcon={<Ticket className="w-16 h-16 text-gray-300 mx-auto" />}
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

      <CouponFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false })}
        onSaved={() => {
          setFormModal({ isOpen: false });
          fetchCoupons(currentPage);
        }}
        couponUuid={formModal.couponUuid}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, coupon: null, isLoading: false })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kupon"
        message={`Apakah Anda yakin ingin menghapus kupon "${deleteModal.coupon?.code || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}
