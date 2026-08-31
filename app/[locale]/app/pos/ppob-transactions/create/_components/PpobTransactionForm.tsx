'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X, Search } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import RupiahInput from '@/components/ui/RupiahInput';
import { useToast } from '@/components/toast/ToastContainer';
import { getAllSaldoAccounts, getPaymentMethodOptions, SaldoAccount, PaymentMethodOption } from '@/lib/api/app/saldo';
import { getPpobTransactionTypes, createPpobTransaction, PpobTransactionType } from '@/lib/api/app/ppob-transaction';

interface BranchOption {
  uuid: string;
  name: string;
  code?: string;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function PpobTransactionForm() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [accounts, setAccounts] = useState<SaldoAccount[]>([]);
  const [types, setTypes] = useState<PpobTransactionType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);

  const [branchUuid, setBranchUuid] = useState('');
  const [accountUuid, setAccountUuid] = useState('');
  const [transactionTypeUuid, setTransactionTypeUuid] = useState('');
  const [accountReference, setAccountReference] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [adminFee, setAdminFee] = useState('');
  const [paymentMethodUuid, setPaymentMethodUuid] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  // Default "Uang Diterima" = "Harga Jual" (uang pas, kasus paling umum) --
  // berhenti ikut sinkron begitu kasir mengetik nilai lain sendiri (mis.
  // pelanggan bayar lebih & perlu kembalian).
  const [paidAmountTouched, setPaidAmountTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [typeSearch, setTypeSearch] = useState('');

  useEffect(() => {
    fetch('/api/app/pos/branches/options')
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'success' && result.data) setBranches(result.data);
      })
      .catch(() => {});

    getAllSaldoAccounts()
      .then((result) => {
        if (result.data) setAccounts(result.data.data || []);
      })
      .catch(() => {});

    getPpobTransactionTypes()
      .then((result) => {
        if (result.status === 'success') setTypes((result.data || []).filter((t) => t.is_active));
      })
      .catch(() => {});

    getPaymentMethodOptions()
      .then((result) => {
        if (result.status === 'success') {
          const paymentItems = result.data || [];
          setPaymentMethods(paymentItems);
          const cashMethod = paymentItems.find((pm) => pm.type === 'cash');
          if (cashMethod) setPaymentMethodUuid(cashMethod.uuid);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!paidAmountTouched) {
      setPaidAmount(sellingAmount);
    }
  }, [sellingAmount, paidAmountTouched]);

  const accountOptions = accounts.filter((a) => a.is_ppob_server);
  const filteredTypes = types.filter((t) => t.name.toLowerCase().includes(typeSearch.trim().toLowerCase()));
  const selectedType = types.find((t) => t.uuid === transactionTypeUuid);
  const isRefund = selectedType?.cash_direction === 'in';
  const selectedPaymentMethod = paymentMethods.find((pm) => pm.uuid === paymentMethodUuid);
  const isCashPayment = selectedPaymentMethod?.type === 'cash';

  const baseAmountNumber = Number(baseAmount) || 0;
  const sellingAmountNumber = Number(sellingAmount) || 0;
  const adminFeeNumber = Number(adminFee) || 0;
  const netProfit = sellingAmountNumber - baseAmountNumber - adminFeeNumber;
  const paidAmountNumber = Number(paidAmount) || 0;

  const effectivePaidAmount = isRefund
    ? sellingAmountNumber
    : isCashPayment
      ? paidAmountNumber
      : sellingAmountNumber;
  const changeAmount = !isRefund && isCashPayment ? Math.max(effectivePaidAmount - sellingAmountNumber, 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const result = await createPpobTransaction({
        branch_uuid: branchUuid,
        saldo_account_uuid: accountUuid,
        transaction_type_uuid: transactionTypeUuid,
        account_reference: accountReference || undefined,
        base_amount: baseAmountNumber,
        selling_amount: sellingAmountNumber,
        admin_fee: adminFeeNumber,
        payment_method_uuid: paymentMethodUuid,
        paid_amount: effectivePaidAmount,
        notes: notes || undefined,
      });

      if (result.status === 'success' && result.data) {
        toast.success('Transaksi berhasil dibuat');
        router.push('/app/pos/ppob-transactions');
      } else {
        if (result.errors) setFieldErrors(result.errors);
        const errorMsg = result.message || 'Gagal membuat transaksi';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Transaksi Server Pulsa/PPOB</h1>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kiri: pilih Jenis Transaksi -- pola sama dgn Kasir (panel pilih di kiri,
              detail/checkout di kanan). Tinggi card disamakan dgn panel kanan (h-full
              di parent grid yg default stretch), list-nya scroll sendiri di dalam
              sisa ruang (flex-1) + ada search, supaya tetap nyaman dipakai walau
              jenis transaksinya banyak. */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Transaksi <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-400 mb-3">Klik salah satu untuk memilih.</p>
              {types.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada jenis transaksi -- tambah dulu lewat tombol &quot;Jenis Transaksi&quot; di halaman daftar Server Pulsa/PPOB.</p>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={typeSearch}
                      onChange={(e) => setTypeSearch(e.target.value)}
                      placeholder="Cari jenis transaksi..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-h-40 overflow-y-auto pr-1">
                    {filteredTypes.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Tidak ada jenis transaksi yang cocok.</p>
                    ) : (
                      filteredTypes.map((type) => {
                        const isSelected = type.uuid === transactionTypeUuid;
                        return (
                          <button
                            key={type.uuid}
                            type="button"
                            onClick={() => setTransactionTypeUuid(type.uuid)}
                            className={`w-full px-4 py-3 text-sm font-medium border rounded-lg text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#EBC170] bg-[#FDF6E9] text-gray-900 ring-2 ring-[#EBC170]/40'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {type.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
              {fieldErrors.transactionTypeUuid && <div className="mt-2 text-sm text-red-600">{fieldErrors.transactionTypeUuid[0]}</div>}
            </div>
          </div>

          {/* Kanan: detail transaksi & pembayaran */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cabang <span className="text-red-500">*</span></label>
                  <select
                    value={branchUuid}
                    onChange={(e) => setBranchUuid(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.branchUuid ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((branch) => (
                      <option key={branch.uuid} value={branch.uuid}>{branch.code ? `${branch.code} - ` : ''}{branch.name}</option>
                    ))}
                  </select>
                  {fieldErrors.branchUuid && <div className="mt-1 text-sm text-red-600">{fieldErrors.branchUuid[0]}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Akun Server PPOB <span className="text-red-500">*</span></label>
                  <select
                    value={accountUuid}
                    onChange={(e) => setAccountUuid(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.saldoAccountUuid ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
                  >
                    <option value="">Pilih Akun</option>
                    {accountOptions.map((account) => (
                      <option key={account.uuid} value={account.uuid}>{account.name}</option>
                    ))}
                  </select>
                  {accountOptions.length === 0 && (
                    <p className="mt-1 text-xs text-gray-400">Belum ada akun yang ditandai untuk Server PPOB -- centang di menu Saldo &gt; Edit Akun dulu.</p>
                  )}
                  {fieldErrors.saldoAccountUuid && <div className="mt-1 text-sm text-red-600">{fieldErrors.saldoAccountUuid[0]}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. Tujuan (opsional)</label>
                  <input
                    type="text"
                    value={accountReference}
                    onChange={(e) => setAccountReference(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
                    placeholder="No. HP / No. Meter / ID Pelanggan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modal <span className="text-red-500">*</span></label>
                  <RupiahInput
                    value={baseAmount}
                    onChange={setBaseAmount}
                    hasError={!!fieldErrors.baseAmount}
                  />
                  {fieldErrors.baseAmount && <div className="mt-1 text-sm text-red-600">{fieldErrors.baseAmount[0]}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRefund ? 'Nominal Dikembalikan' : 'Harga Jual'} <span className="text-red-500">*</span>
                  </label>
                  <RupiahInput
                    value={sellingAmount}
                    onChange={setSellingAmount}
                    hasError={!!fieldErrors.sellingAmount}
                  />
                  {fieldErrors.sellingAmount && <div className="mt-1 text-sm text-red-600">{fieldErrors.sellingAmount[0]}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Biaya Admin PPOB (kosongkan kalau tidak ada)</label>
                  <RupiahInput value={adminFee} onChange={setAdminFee} />
                  <p className="mt-1 text-xs text-gray-500">
                    Biaya yang dipotong server/provider dari deposit -- ditanggung toko, bukan dibayar pelanggan.
                  </p>
                  {(sellingAmountNumber > 0 || adminFeeNumber > 0) && (
                    <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
                      <p className="text-xs text-gray-500">Laba Bersih (jual − modal − biaya admin)</p>
                      <p className={`text-base font-bold ${netProfit === 0 ? 'text-gray-400' : netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metode Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethodUuid}
                    onChange={(e) => setPaymentMethodUuid(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.paymentMethodUuid ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
                  >
                    <option value="">Pilih Metode Pembayaran</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.uuid} value={pm.uuid}>{pm.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    {isRefund ? 'Akun kas yang dipakai buat menyerahkan tunai ke customer.' : 'Akun kas yang menerima pembayaran dari customer.'}
                  </p>
                  {fieldErrors.paymentMethodUuid && <div className="mt-1 text-sm text-red-600">{fieldErrors.paymentMethodUuid[0]}</div>}
                </div>

                {!isRefund && isCashPayment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Uang Diterima</label>
                    <RupiahInput
                      value={paidAmount}
                      onChange={(v) => {
                        setPaidAmount(v);
                        setPaidAmountTouched(true);
                      }}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Default mengikuti Harga Jual (uang pas) -- ubah kalau pelanggan bayar lebih.
                    </p>
                    {paidAmountNumber > 0 && (
                      <p className="mt-1 text-xs text-gray-500">Kembalian: {formatCurrency(changeAmount)}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white resize-none"
                  placeholder="Opsional"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <Link href="/app/pos/ppob-transactions">
                  <Button type="button" variant="light" icon={X}>Batal</Button>
                </Link>
                <Button type="submit" variant="warning" icon={Save} isLoading={isLoading}>Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
