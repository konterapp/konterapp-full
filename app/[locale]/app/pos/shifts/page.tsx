'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CircleDot } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/toast/ToastContainer';

interface BranchOption {
  uuid: string;
  name: string;
}

interface ShiftUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
}

interface ShiftBranch {
  uuid: string;
  name: string;
  code: string;
}

interface ShiftRecord {
  uuid: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number;
  total_sales: number;
  expected_cash: number;
  closing_cash: number | null;
  variance: number;
  notes_open: string | null;
  notes_close: string | null;
  branch: ShiftBranch | null;
  user: ShiftUser | null;
}

interface ActiveShift extends ShiftRecord {
  current_total_sales: number;
  current_expected_cash: number;
}

function toNumberInput(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return parsed;
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatCurrency(value: number | null) {
  if (value === null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

export default function CashierShiftsPage() {
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<ShiftRecord[]>([]);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('opened_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [filters, setFilters] = useState({
    branch_uuid: '',
    status: '',
  });

  const [openForm, setOpenForm] = useState({
    branch_uuid: '',
    opening_cash: '',
    notes_open: '',
  });

  const [closeForm, setCloseForm] = useState({
    closing_cash: '',
    notes_close: '',
  });

  const [isSubmittingOpen, setIsSubmittingOpen] = useState(false);
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchShifts = useCallback(
    async (page: number) => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams({
          page: String(page),
          per_page: String(itemsPerPage),
          search: debouncedSearch,
          sort_by: sortBy,
          sort_order: sortOrder,
        });

        if (filters.branch_uuid) params.append('branch_uuid', filters.branch_uuid);
        if (filters.status) params.append('status', filters.status);

        const response = await fetch(`/api/app/pos/shifts?${params.toString()}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          setRows(result.data.data || []);
          setActiveShift(result.data.active_shift || null);
          setBranches(result.data.filters?.branches || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
          setTotalItems(result.data.pagination?.total || 0);

          if (result.data.active_shift && !closeForm.closing_cash) {
            setCloseForm((prev) => ({
              ...prev,
              closing_cash: String(Math.round(result.data.active_shift.current_expected_cash || 0)),
            }));
          }
        } else {
          setRows([]);
          setActiveShift(null);
          setTotalPages(1);
          setTotalItems(0);
        }
      } catch {
        setRows([]);
        setActiveShift(null);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [itemsPerPage, debouncedSearch, sortBy, sortOrder, filters.branch_uuid, filters.status, closeForm.closing_cash]
  );

  useEffect(() => {
    fetchShifts(currentPage);
  }, [currentPage, fetchShifts]);

  const handleOpenShift = async (e: FormEvent) => {
    e.preventDefault();

    if (!openForm.branch_uuid) {
      toast.error('Cabang wajib dipilih');
      return;
    }

    const openingCash = toNumberInput(openForm.opening_cash);
    if (!Number.isFinite(openingCash) || openingCash < 0) {
      toast.error('Kas awal wajib berupa angka >= 0');
      return;
    }

    setIsSubmittingOpen(true);
    try {
      const response = await fetch('/api/app/pos/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_uuid: openForm.branch_uuid,
          opening_cash: openingCash,
          notes_open: openForm.notes_open,
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Shift kasir berhasil dibuka');
        setOpenForm({ branch_uuid: '', opening_cash: '', notes_open: '' });
        setCloseForm({ closing_cash: '', notes_close: '' });
        fetchShifts(1);
        setCurrentPage(1);
      } else {
        toast.error(result.message || 'Gagal membuka shift');
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmittingOpen(false);
    }
  };

  const handleCloseShift = async (e: FormEvent) => {
    e.preventDefault();

    if (!activeShift) {
      toast.error('Tidak ada shift aktif');
      return;
    }

    const closingCash = toNumberInput(closeForm.closing_cash);
    if (!Number.isFinite(closingCash) || closingCash < 0) {
      toast.error('Kas akhir wajib berupa angka >= 0');
      return;
    }

    setIsSubmittingClose(true);
    try {
      const response = await fetch(`/api/app/pos/shifts/${activeShift.uuid}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closing_cash: closingCash,
          notes_close: closeForm.notes_close,
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Shift kasir berhasil ditutup');
        setCloseForm({ closing_cash: '', notes_close: '' });
        fetchShifts(1);
        setCurrentPage(1);
      } else {
        toast.error(result.message || 'Gagal menutup shift');
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const filterComponent = useMemo(
    () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
          <select
            value={filters.branch_uuid}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, branch_uuid: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          >
            <option value="">Semua Cabang</option>
            {branches.map((branch) => (
              <option key={branch.uuid} value={branch.uuid}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, status: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
          >
            <option value="">Semua Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    ),
    [filters.branch_uuid, filters.status, branches]
  );

  const columns: Column<ShiftRecord>[] = [
    {
      key: 'opened_at',
      label: 'Buka Shift',
      sortable: true,
      render: (_, row) => <span className="text-xs text-gray-700">{formatDateTime(row.opened_at)}</span>,
    },
    {
      key: 'closed_at',
      label: 'Tutup Shift',
      sortable: true,
      render: (_, row) => <span className="text-xs text-gray-700">{formatDateTime(row.closed_at)}</span>,
    },
    {
      key: 'branch_name',
      label: 'Cabang',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-700">{row.branch?.name || '-'}</span>,
    },
    {
      key: 'cashier_name',
      label: 'Kasir',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-700">{row.user?.name || '-'}</span>,
    },
    {
      key: 'opening_cash',
      label: 'Kas Awal',
      sortable: true,
      render: (_, row) => <span className="text-sm text-gray-700">{formatCurrency(row.opening_cash)}</span>,
    },
    {
      key: 'total_sales',
      label: 'Total Sales',
      sortable: true,
      render: (_, row) => <span className="text-sm text-gray-700">{formatCurrency(row.total_sales)}</span>,
    },
    {
      key: 'expected_cash',
      label: 'Kas Seharusnya',
      sortable: true,
      render: (_, row) => <span className="text-sm text-gray-700">{formatCurrency(row.expected_cash)}</span>,
    },
    {
      key: 'closing_cash',
      label: 'Kas Akhir',
      sortable: false,
      render: (_, row) => <span className="text-sm text-gray-700">{formatCurrency(row.closing_cash)}</span>,
    },
    {
      key: 'variance',
      label: 'Selisih',
      sortable: true,
      render: (_, row) => (
        <span
          className={
            row.variance > 0
              ? 'text-green-600 font-semibold'
              : row.variance < 0
              ? 'text-red-600 font-semibold'
              : 'text-gray-700 font-semibold'
          }
        >
          {formatCurrency(row.variance)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => (
        <span
          className={
            row.status === 'open'
              ? 'inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium'
              : 'inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium'
          }
        >
          {row.status === 'open' ? 'Open' : 'Closed'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52] flex items-center gap-2">
          <CircleDot className="w-6 h-6" />
          Shift Kasir
        </h1>
        <p className="text-gray-600 mt-1">Buka/tutup shift kasir dan pantau histori kas per shift.</p>
      </div>

      {activeShift ? (
        <div className="bg-white border border-green-200 rounded-lg p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-green-700">Shift Aktif</h2>
            <p className="text-sm text-gray-600 mt-1">
              Dibuka: {formatDateTime(activeShift.opened_at)} | Cabang: {activeShift.branch?.name || '-'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Kas Awal</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(activeShift.opening_cash)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Sales Berjalan</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(activeShift.current_total_sales)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Kas Seharusnya (Live)</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(activeShift.current_expected_cash)}</p>
            </div>
          </div>

          <form onSubmit={handleCloseShift} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kas Akhir (Real)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={closeForm.closing_cash}
                onChange={(e) => setCloseForm((prev) => ({ ...prev, closing_cash: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tutup Shift</label>
              <input
                type="text"
                value={closeForm.notes_close}
                onChange={(e) => setCloseForm((prev) => ({ ...prev, notes_close: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                placeholder="Opsional"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmittingClose}
                className="w-full px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingClose ? 'Menutup...' : 'Tutup Shift'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-[#142D52] mb-3">Buka Shift Baru</h2>
          <form onSubmit={handleOpenShift} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
              <select
                value={openForm.branch_uuid}
                onChange={(e) => setOpenForm((prev) => ({ ...prev, branch_uuid: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              >
                <option value="">Pilih Cabang</option>
                {branches.map((branch) => (
                  <option key={branch.uuid} value={branch.uuid}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kas Awal</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={openForm.opening_cash}
                onChange={(e) => setOpenForm((prev) => ({ ...prev, opening_cash: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Buka Shift</label>
              <input
                type="text"
                value={openForm.notes_open}
                onChange={(e) => setOpenForm((prev) => ({ ...prev, notes_open: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                placeholder="Opsional"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSubmittingOpen}
                className="w-full px-4 py-2 rounded-lg bg-[#EBC170] hover:bg-[#d4ab5f] text-gray-900 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingOpen ? 'Membuka...' : 'Buka Shift'}
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        data={rows}
        columns={columns}
        itemsPerPage={itemsPerPage}
        searchPlaceholder="Cari cabang, kasir, atau catatan..."
        emptyMessage="Belum ada histori shift"
        emptyIcon={<CircleDot className="w-16 h-16 text-gray-300 mx-auto" />}
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
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
          setCurrentPage(1);
        }}
        isLoading={isLoading}
        getRowId={(row) => row.uuid}
      />
    </div>
  );
}
