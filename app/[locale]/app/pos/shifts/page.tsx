'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CircleDot, Wallet, X } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/toast/ToastContainer';
import { getShiftBranchSaldo, BranchSaldoItem } from '@/lib/api/app/branch';

interface SaldoSnapshot {
  data: BranchSaldoItem[];
  total_balance: number;
}

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
  total_sales: number;
  notes_open: string | null;
  notes_close: string | null;
  opening_saldo: SaldoSnapshot | null;
  closing_saldo: SaldoSnapshot | null;
  branch: ShiftBranch | null;
  user: ShiftUser | null;
}

interface ActiveShift extends ShiftRecord {
  current_total_sales: number;
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
    notes_open: '',
  });

  const [closeForm, setCloseForm] = useState({
    notes_close: '',
  });

  const [isSubmittingOpen, setIsSubmittingOpen] = useState(false);
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);

  const [openShiftSaldo, setOpenShiftSaldo] = useState<{
    isLoading: boolean;
    error: string;
    items: BranchSaldoItem[];
    totalBalance: number;
  }>({ isLoading: false, error: '', items: [], totalBalance: 0 });
  const [closeShiftSaldo, setCloseShiftSaldo] = useState<{
    isLoading: boolean;
    error: string;
    items: BranchSaldoItem[];
    totalBalance: number;
  }>({ isLoading: false, error: '', items: [], totalBalance: 0 });

  const [saldoModal, setSaldoModal] = useState<{ isOpen: boolean; row: ShiftRecord | null }>({
    isOpen: false,
    row: null,
  });

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
    [itemsPerPage, debouncedSearch, sortBy, sortOrder, filters.branch_uuid, filters.status]
  );

  useEffect(() => {
    fetchShifts(currentPage);
  }, [currentPage, fetchShifts]);

  useEffect(() => {
    if (activeShift || !openForm.branch_uuid) {
      setOpenShiftSaldo({ isLoading: false, error: '', items: [], totalBalance: 0 });
      return;
    }
    let cancelled = false;
    setOpenShiftSaldo((prev) => ({ ...prev, isLoading: true, error: '' }));
    getShiftBranchSaldo(openForm.branch_uuid)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 'success' && res.data) {
          setOpenShiftSaldo({
            isLoading: false,
            error: '',
            items: res.data.data || [],
            totalBalance: res.data.total_balance || 0,
          });
        } else {
          setOpenShiftSaldo({ isLoading: false, error: res.message || 'Gagal memuat saldo cabang', items: [], totalBalance: 0 });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setOpenShiftSaldo({ isLoading: false, error: 'Gagal memuat saldo cabang', items: [], totalBalance: 0 });
      });
    return () => { cancelled = true; };
  }, [openForm.branch_uuid, activeShift]);

  useEffect(() => {
    if (!activeShift?.branch?.uuid) {
      setCloseShiftSaldo({ isLoading: false, error: '', items: [], totalBalance: 0 });
      return;
    }
    let cancelled = false;
    setCloseShiftSaldo((prev) => ({ ...prev, isLoading: true, error: '' }));
    getShiftBranchSaldo(activeShift.branch.uuid)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 'success' && res.data) {
          setCloseShiftSaldo({
            isLoading: false,
            error: '',
            items: res.data.data || [],
            totalBalance: res.data.total_balance || 0,
          });
        } else {
          setCloseShiftSaldo({ isLoading: false, error: res.message || 'Gagal memuat saldo cabang', items: [], totalBalance: 0 });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCloseShiftSaldo({ isLoading: false, error: 'Gagal memuat saldo cabang', items: [], totalBalance: 0 });
      });
    return () => { cancelled = true; };
  }, [activeShift?.branch?.uuid]);

  const handleOpenShift = async (e: FormEvent) => {
    e.preventDefault();

    if (!openForm.branch_uuid) {
      toast.error('Cabang wajib dipilih');
      return;
    }

    setIsSubmittingOpen(true);
    try {
      const response = await fetch('/api/app/pos/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_uuid: openForm.branch_uuid,
          notes_open: openForm.notes_open,
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Shift kasir berhasil dibuka');
        setOpenForm({ branch_uuid: '', notes_open: '' });
        setCloseForm({ notes_close: '' });
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

    setIsSubmittingClose(true);
    try {
      const response = await fetch(`/api/app/pos/shifts/${activeShift.uuid}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes_close: closeForm.notes_close,
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Shift kasir berhasil ditutup');
        setCloseForm({ notes_close: '' });
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

  const handleSaldoClick = (row: ShiftRecord) => {
    setSaldoModal({ isOpen: true, row });
  };

  const handleSaldoClose = () => {
    setSaldoModal({ isOpen: false, row: null });
  };

  const renderSaldoSnapshot = (title: string, snapshot: SaldoSnapshot | null) => (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-2">{title}</p>
      {!snapshot || snapshot.data.length === 0 ? (
        <div className="text-sm text-gray-400 italic">Tidak ada data</div>
      ) : (
        <div className="space-y-2">
          {snapshot.data.map((item) => (
            <div key={`${item.account.uuid}-${item.group.uuid}`} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {item.account.name}
                {item.group.name ? <span className="text-gray-400"> ({item.group.name})</span> : ''}
              </span>
              <span className="font-medium text-[#142D52]">{formatCurrency(item.group.balance)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-200">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="font-bold text-[#142D52]">{formatCurrency(snapshot.total_balance)}</span>
          </div>
        </div>
      )}
    </div>
  );

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
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      width: '7rem',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => handleSaldoClick(row)}
          disabled={!row.opening_saldo && !row.closing_saldo}
          className="relative group inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg transition-colors text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Saldo</span>
        </button>
      ),
    },
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
      key: 'total_sales',
      label: 'Total Sales',
      sortable: true,
      render: (_, row) => <span className="text-sm text-gray-700">{formatCurrency(row.total_sales)}</span>,
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
        <p className="text-gray-600 mt-1">Buka/tutup shift kasir dan pantau histori shift. Rekonsiliasi kas sekarang dilakukan lewat menu Saldo.</p>
      </div>

      {activeShift ? (
        <div className="bg-white border border-green-200 rounded-lg p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-green-700">Shift Aktif</h2>
            <p className="text-sm text-gray-600 mt-1">
              Dibuka: {formatDateTime(activeShift.opened_at)} | Cabang: {activeShift.branch?.name || '-'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Sales Berjalan</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(activeShift.current_total_sales)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Saldo Cabang Ini</p>
            {closeShiftSaldo.isLoading ? (
              <p className="text-xs text-gray-400">Memuat saldo...</p>
            ) : closeShiftSaldo.error ? (
              <p className="text-xs text-red-500">{closeShiftSaldo.error}</p>
            ) : closeShiftSaldo.items.length === 0 ? (
              <p className="text-xs text-gray-400">Belum ada akun saldo untuk cabang ini</p>
            ) : (
              <div className="space-y-1.5">
                {closeShiftSaldo.items.map((item) => (
                  <div key={`${item.account.uuid}-${item.group.uuid}`} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.account.name}
                      {item.group.name ? <span className="text-gray-400"> ({item.group.name})</span> : ''}
                    </span>
                    <span className="font-medium text-[#142D52]">{formatCurrency(item.group.balance)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="font-bold text-[#142D52]">{formatCurrency(closeShiftSaldo.totalBalance)}</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleCloseShift} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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

          {openForm.branch_uuid && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Saldo Cabang Ini</p>
              {openShiftSaldo.isLoading ? (
                <p className="text-xs text-gray-400">Memuat saldo...</p>
              ) : openShiftSaldo.error ? (
                <p className="text-xs text-red-500">{openShiftSaldo.error}</p>
              ) : openShiftSaldo.items.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada akun saldo untuk cabang ini</p>
              ) : (
                <div className="space-y-1.5">
                  {openShiftSaldo.items.map((item) => (
                    <div key={`${item.account.uuid}-${item.group.uuid}`} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.account.name}
                        {item.group.name ? <span className="text-gray-400"> ({item.group.name})</span> : ''}
                      </span>
                      <span className="font-medium text-[#142D52]">{formatCurrency(item.group.balance)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="font-bold text-[#142D52]">{formatCurrency(openShiftSaldo.totalBalance)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleOpenShift} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {saldoModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
          onClick={(e) => { if (e.target === e.currentTarget) handleSaldoClose(); }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Saldo Cabang {saldoModal.row?.branch?.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Snapshot saldo pada saat shift ini dibuka & ditutup (bukan saldo terkini).</p>
              </div>
              <button onClick={handleSaldoClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {renderSaldoSnapshot('Saat Buka Shift', saldoModal.row?.opening_saldo ?? null)}
              {renderSaldoSnapshot(
                'Saat Tutup Shift',
                saldoModal.row?.status === 'closed' ? saldoModal.row?.closing_saldo ?? null : null
              )}
              {saldoModal.row?.status !== 'closed' && (
                <p className="text-xs text-gray-400 italic">Shift masih berjalan, saldo tutup belum ada.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
