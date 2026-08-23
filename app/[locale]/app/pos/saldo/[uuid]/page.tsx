'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Wallet, Pencil, PlusCircle, MinusCircle, Plus, Layers, Trash2, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/toast/ToastContainer';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
  SaldoAccount,
  SaldoBalanceGroup,
  SaldoMutation,
  getSaldoAccount,
  getSaldoMutations,
  adjustSaldoBalance,
  addSaldoBalanceGroup,
  deleteSaldoBalanceGroup,
} from '@/lib/api/app/saldo';
import SaldoAccountForm from '../_components/SaldoAccountForm';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const REFERENCE_LABELS: Record<string, string> = {
  sale: 'Penjualan',
  manual_adjustment: 'Koreksi Manual',
  opening_balance: 'Saldo Awal',
};

interface BranchOption {
  uuid: string;
  code: string;
  name: string;
  is_active?: boolean;
}

export default function SaldoAccountDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const toast = useToast();
  const { hasPermission } = usePermissions();

  const [account, setAccount] = useState<SaldoAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [balanceGroups, setBalanceGroups] = useState<SaldoBalanceGroup[]>([]);

  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [linkedFilter, setLinkedFilter] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [addBranchUuids, setAddBranchUuids] = useState<string[]>([]);
  const [addOpeningBalance, setAddOpeningBalance] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addFieldErrors, setAddFieldErrors] = useState<Record<string, string[]>>({});

  const [deleteTarget, setDeleteTarget] = useState<SaldoBalanceGroup | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [mutations, setMutations] = useState<SaldoMutation[]>([]);
  const [mutationsLoading, setMutationsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterBalanceUuid, setFilterBalanceUuid] = useState('');

  const [adjustTarget, setAdjustTarget] = useState<SaldoBalanceGroup | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'in' | 'out'>('in');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');
  const [adjustFieldErrors, setAdjustFieldErrors] = useState<Record<string, string[]>>({});

  const fetchAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await getSaldoAccount(uuid);
      if (result.status === 'success' && result.data) {
        setAccount(result.data);
        setBalanceGroups(result.data.balances || []);
      } else {
        setError(result.message || 'Gagal memuat data akun saldo');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [uuid]);

  const fetchMutations = useCallback(
    async (pageNum: number) => {
      try {
        setMutationsLoading(true);
        const result = await getSaldoMutations(uuid, pageNum, filterBalanceUuid || undefined);
        if (result.status === 'success' && result.data) {
          setMutations(result.data.data || []);
          setTotalPages(result.data.pagination?.totalPages || 1);
        }
      } finally {
        setMutationsLoading(false);
      }
    },
    [uuid, filterBalanceUuid]
  );

  useEffect(() => {
    fetchAccount();
    fetch('/api/app/pos/branches?per_page=100')
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success' && result.data?.data) {
          setBranchOptions(result.data.data);
        }
      })
      .catch(() => {});
  }, [fetchAccount]);

  useEffect(() => {
    setPage(1);
    fetchMutations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMutations]);

  const openAdjustModal = (group: SaldoBalanceGroup, direction: 'in' | 'out') => {
    setAdjustTarget(group);
    setAdjustDirection(direction);
    setAdjustAmount('');
    setAdjustNotes('');
    setAdjustError('');
    setAdjustFieldErrors({});
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setAdjustLoading(true);
    setAdjustError('');
    setAdjustFieldErrors({});
    try {
      const result = await adjustSaldoBalance(adjustTarget.uuid, {
        direction: adjustDirection,
        amount: Number(adjustAmount),
        notes: adjustNotes,
      });
      if (result.status === 'success') {
        toast.success('Saldo berhasil dikoreksi');
        setAdjustTarget(null);
        fetchAccount();
        fetchMutations(1);
      } else {
        if (result.errors) {
          setAdjustFieldErrors(result.errors);
        }
        setAdjustError(result.message || 'Gagal mengoreksi saldo');
      }
    } catch {
      setAdjustError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const toggleAddBranch = (branchUuid: string) => {
    setAddBranchUuids(prev =>
      prev.includes(branchUuid) ? prev.filter(item => item !== branchUuid) : [...prev, branchUuid]
    );
    if (addFieldErrors.branch_uuids) {
      setAddFieldErrors(prev => {
        const next = { ...prev };
        delete next.branch_uuids;
        return next;
      });
    }
  };

  const openAddModal = () => {
    const linkedBranchUuids = new Set(balanceGroups.flatMap(group => group.branches.map(b => b.uuid)));
    setAddBranchUuids([]);
    setAddOpeningBalance('');
    setAddNotes('');
    setAddError('');
    setAddFieldErrors({});
    // Cabang yang sudah masuk grup lain tidak boleh dipilih lagi (unique
    // per akun induk), jadi sembunyikan dari daftar.
    setLinkedFilter(linkedBranchUuids);
    setAddOpen(true);
  };

  const availableBranchOptions = branchOptions.filter(b => !linkedFilter.has(b.uuid));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    setAddFieldErrors({});
    try {
      const result = await addSaldoBalanceGroup(uuid, {
        branch_uuids: addBranchUuids,
        opening_balance: Number(addOpeningBalance) || 0,
        notes: addNotes || undefined,
      });
      if (result.status === 'success') {
        toast.success('Grup balance berhasil ditambahkan');
        setAddOpen(false);
        fetchAccount();
        fetchMutations(1);
      } else {
        if (result.errors) {
          setAddFieldErrors(result.errors);
        }
        setAddError(result.message || 'Gagal menambah grup balance');
      }
    } catch {
      setAddError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const result = await deleteSaldoBalanceGroup(deleteTarget.uuid);
      if (result.status === 'success') {
        toast.success('Grup balance berhasil dihapus');
        setDeleteTarget(null);
        fetchAccount();
        fetchMutations(1);
      } else {
        toast.error(result.message || 'Gagal menghapus grup balance');
        setDeleteLoading(false);
      }
    } catch {
      toast.error('Gagal menghapus grup balance. Silakan coba lagi.');
      setDeleteLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="space-y-6">
        <Link href="/app/pos/saldo" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Saldo</span>
        </Link>
        <Alert variant="error" message={error || 'Akun saldo tidak ditemukan'} />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setIsEditing(false)}
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Detail Saldo</span>
        </button>
        <SaldoAccountForm mode="edit" saldoUuid={uuid} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/app/pos/saldo" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Daftar Saldo</span>
        </Link>
        {hasPermission('pos.saldo.update') && (
          <Button variant="light" icon={Pencil} onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm font-mono">{account.code}</div>
            <h1 className="text-2xl font-bold text-[#142D52] flex items-center gap-2 mt-1">
              <Wallet className="h-6 w-6" />
              {account.name}
            </h1>
            {account.description && <p className="text-gray-600 mt-1">{account.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                {account.type === 'cash' ? 'Tunai' : account.type === 'bank' ? 'Bank' : account.type === 'e_wallet' ? 'E-Wallet' : 'Lainnya'}
              </span>
              {account.is_payment_method && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Metode Bayar</span>
              )}
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {account.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">Total Saldo (semua grup)</div>
            <div className="text-3xl font-bold text-[#142D52]">{formatCurrency(account.balance)}</div>
            <div className="text-xs text-gray-400 mt-1">{balanceGroups.length} grup balance</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Grup Balance per Kelompok Cabang
          </h2>
          {hasPermission('pos.saldo.update') && (
            <Button size="sm" variant="warning" icon={Plus} onClick={openAddModal}>
              Tambah Grup Balance
            </Button>
          )}
        </div>

        {balanceGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Belum ada grup balance</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {balanceGroups.map((group, index) => (
              <div key={group.uuid} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Grup {index + 1}</div>
                    <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                      {group.branches.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Belum ada cabang ter-link</span>
                      ) : (
                        group.branches.map(branch => (
                          <span key={branch.uuid} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700">
                            <MapPin className="w-3 h-3" />
                            {branch.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#142D52]">{formatCurrency(group.balance)}</div>
                  </div>
                </div>

                {hasPermission('pos.saldo.update') && (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    <Button size="sm" variant="success" icon={PlusCircle} onClick={() => openAdjustModal(group, 'in')}>
                      Top-up
                    </Button>
                    <Button size="sm" variant="danger" icon={MinusCircle} onClick={() => openAdjustModal(group, 'out')}>
                      Koreksi Kurang
                    </Button>
                    {hasPermission('pos.saldo.delete') && (
                      <button
                        onClick={() => setDeleteTarget(group)}
                        className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Grup
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Mutasi</h2>
          {balanceGroups.length > 1 && (
            <select
              value={filterBalanceUuid}
              onChange={(e) => setFilterBalanceUuid(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white cursor-pointer"
            >
              <option value="">Semua Grup</option>
              {balanceGroups.map((group, index) => (
                <option key={group.uuid} value={group.uuid}>
                  Grup {index + 1} ({group.branches.map(b => b.name).join(', ')})
                </option>
              ))}
            </select>
          )}
        </div>
        {mutationsLoading ? (
          <div className="text-center py-8 text-gray-500">Memuat mutasi...</div>
        ) : mutations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Belum ada mutasi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Tanggal</th>
                  <th className="py-2 pr-4 font-medium">Tipe</th>
                  <th className="py-2 pr-4 font-medium text-right">Jumlah</th>
                  <th className="py-2 pr-4 font-medium text-right">Saldo Sesudah</th>
                  <th className="py-2 pr-4 font-medium">Cabang</th>
                  <th className="py-2 pr-4 font-medium">Catatan</th>
                  <th className="py-2 pr-4 font-medium">Oleh</th>
                </tr>
              </thead>
              <tbody>
                {mutations.map((m) => (
                  <tr key={m.uuid} className="border-b border-gray-100">
                    <td className="py-2 pr-4 whitespace-nowrap text-gray-600">{formatDateTime(m.created_at)}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${m.direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {REFERENCE_LABELS[m.reference_type] || m.reference_type}
                      </span>
                    </td>
                    <td className={`py-2 pr-4 text-right font-medium whitespace-nowrap ${m.direction === 'in' ? 'text-green-700' : 'text-red-700'}`}>
                      {m.direction === 'in' ? '+' : '-'}{formatCurrency(m.amount)}
                    </td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap text-gray-700">{formatCurrency(m.balance_after)}</td>
                    <td className="py-2 pr-4 text-gray-600">{m.branch?.name || '-'}</td>
                    <td className="py-2 pr-4 text-gray-600">{m.notes || '-'}</td>
                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{m.creator?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button size="sm" variant="light" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Sebelumnya
            </Button>
            <span className="text-sm text-gray-600">Halaman {page} dari {totalPages}</span>
            <Button size="sm" variant="light" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              Berikutnya
            </Button>
          </div>
        )}
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
          onClick={(e) => { if (e.target === e.currentTarget) setAddOpen(false); }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Grup Balance</h3>
              <p className="text-sm text-gray-500 mt-1">Pilih cabang yang akan masuk grup ini. Cabang yang sudah ada di grup lain akan dipindahkan ke grup baru.</p>
            </div>
            <form onSubmit={handleAddSubmit} className="px-6 py-4 space-y-4">
              {addError && <Alert variant="error" message={addError} />}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cabang <span className="text-red-500">*</span></label>
                {availableBranchOptions.length === 0 ? (
                  <div className="text-sm text-gray-400 italic py-2">Semua cabang sudah punya grup balance untuk akun ini</div>
                ) : (
                  <div className="space-y-2">
                    {availableBranchOptions.map(branch => (
                      <label key={branch.uuid} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addBranchUuids.includes(branch.uuid)}
                          onChange={() => toggleAddBranch(branch.uuid)}
                          className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170] cursor-pointer"
                        />
                        <span>{branch.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{branch.code}</span>
                      </label>
                    ))}
                  </div>
                )}
                {addFieldErrors.branch_uuids && <div className="mt-1 text-sm text-red-600">{addFieldErrors.branch_uuids[0]}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Awal Grup</label>
                <input
                  type="number"
                  min="0"
                  value={addOpeningBalance}
                  onChange={(e) => setAddOpeningBalance(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    addFieldErrors.opening_balance ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
                  }`}
                  placeholder="0"
                />
                {addFieldErrors.opening_balance && <div className="mt-1 text-sm text-red-600">{addFieldErrors.opening_balance[0]}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white resize-none ${
                    addFieldErrors.notes ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
                  }`}
                  placeholder="Misal: alasan pemisahan grup"
                />
                {addFieldErrors.notes && <div className="mt-1 text-sm text-red-600">{addFieldErrors.notes[0]}</div>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="light" onClick={() => setAddOpen(false)} disabled={addLoading}>
                  Batal
                </Button>
                <Button type="submit" variant="warning" isLoading={addLoading}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
          onClick={(e) => { if (e.target === e.currentTarget) setAdjustTarget(null); }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {adjustDirection === 'in' ? 'Top-up / Tambah Saldo' : 'Koreksi Kurangi Saldo'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Grup: {adjustTarget.branches.map(b => b.name).join(', ') || '-'}
              </p>
            </div>
            <form onSubmit={handleAdjustSubmit} className="px-6 py-4 space-y-4">
              {adjustError && <Alert variant="error" message={adjustError} />}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    adjustFieldErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
                  }`}
                  placeholder="0"
                />
                {adjustFieldErrors.amount && <div className="mt-1 text-sm text-red-600">{adjustFieldErrors.amount[0]}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan <span className="text-red-500">*</span></label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white resize-none ${
                    adjustFieldErrors.notes ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
                  }`}
                  placeholder="Alasan koreksi/top-up saldo"
                />
                {adjustFieldErrors.notes && <div className="mt-1 text-sm text-red-600">{adjustFieldErrors.notes[0]}</div>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="light" onClick={() => setAdjustTarget(null)} disabled={adjustLoading}>
                  Batal
                </Button>
                <Button type="submit" variant={adjustDirection === 'in' ? 'success' : 'danger'} isLoading={adjustLoading}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteGroup}
        title="Hapus Grup Balance"
        message={`Hapus grup balance (${deleteTarget?.branches.map(b => b.name).join(', ')})? Cabang di dalamnya akan kehilangan akses ke akun saldo ini sampai dimasukkan ke grup lain. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
