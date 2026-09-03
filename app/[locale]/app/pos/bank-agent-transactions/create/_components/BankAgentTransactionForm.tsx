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
import { getBankAgentTransactionTypes, createBankAgentTransaction, BankAgentTransactionType } from '@/lib/api/app/bank-agent-transaction';

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

// Field di layar kecil dibuat lebih tinggi & 16px supaya nyaman ditekan jari
// dan Safari iOS tidak auto-zoom saat difokus. Mulai sm kembali ke ukuran
// semula sehingga tampilan desktop tidak berubah.
const FIELD_BASE =
  'w-full px-3 py-3 sm:py-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white';

function fieldClass(hasError?: boolean) {
  return `${FIELD_BASE} ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`;
}

// Pemisah antar kelompok isian -- membantu form panjang ini terbaca sebagai
// beberapa langkah pendek, bukan satu daftar field yang menerus.
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="md:col-span-2 -mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  );
}

export default function BankAgentTransactionForm() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [accounts, setAccounts] = useState<SaldoAccount[]>([]);
  const [types, setTypes] = useState<BankAgentTransactionType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);

  const [branchUuid, setBranchUuid] = useState('');
  const [accountUuid, setAccountUuid] = useState('');
  const [transactionTypeUuid, setTransactionTypeUuid] = useState('');
  const [accountReference, setAccountReference] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [fee, setFee] = useState('');
  const [adminFee, setAdminFee] = useState('');
  const [feeReceivedVia, setFeeReceivedVia] = useState('');
  const [paymentMethodUuid, setPaymentMethodUuid] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  // Khusus mobile: daftar jenis transaksi menciut setelah dipilih supaya
  // form di bawahnya langsung terjangkau tanpa menggulir belasan pilihan.
  // Di desktop (>=lg) daftar ini selalu tampil sebagai panel kiri.
  const [isTypeListOpen, setIsTypeListOpen] = useState(true);

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

    getBankAgentTransactionTypes()
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

  const accountOptions = accounts.filter((a) => a.is_bank_agent);
  const filteredTypes = types.filter((t) => t.name.toLowerCase().includes(typeSearch.trim().toLowerCase()));
  const selectedType = types.find((t) => t.uuid === transactionTypeUuid);
  const isWithdrawal = selectedType?.cash_direction === 'in';
  const selectedPaymentMethod = paymentMethods.find((pm) => pm.uuid === paymentMethodUuid);
  const isCashPayment = selectedPaymentMethod?.type === 'cash';

  const baseAmountNumber = Number(baseAmount) || 0;
  const feeNumber = Number(fee) || 0;
  const adminFeeNumber = Number(adminFee) || 0;
  const netProfit = feeNumber - adminFeeNumber;
  const sellingAmountNumber = Number(sellingAmount) || 0;
  const paidAmountNumber = Number(paidAmount) || 0;

  // Jenis dgn arah kas keluar (mis. Tarik Tunai): bukan customer yang bayar,
  // jadi tidak ada konsep "diterima dari pelanggan"/kembalian -- nominal kena
  // tunai dihitung otomatis di backend sesuai "Komisi Diterima Via". Field
  // ini tetap dikirim (dipakai utk pencatatan), cuma tidak ditampilkan di form.
  const effectiveSellingAmount = isWithdrawal ? baseAmountNumber + feeNumber : sellingAmountNumber;
  const effectivePaidAmount = isWithdrawal
    ? effectiveSellingAmount
    : isCashPayment
      ? paidAmountNumber
      : effectiveSellingAmount;
  const changeAmount = !isWithdrawal && isCashPayment ? Math.max(effectivePaidAmount - effectiveSellingAmount, 0) : 0;

  const handleAutoSellingAmount = () => {
    setSellingAmount(String(baseAmountNumber + feeNumber));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const result = await createBankAgentTransaction({
        branch_uuid: branchUuid,
        saldo_account_uuid: accountUuid,
        transaction_type_uuid: transactionTypeUuid,
        account_reference: accountReference || undefined,
        base_amount: baseAmountNumber,
        selling_amount: effectiveSellingAmount,
        fee: feeNumber,
        admin_fee: Number(adminFee) || 0,
        fee_received_via: isWithdrawal ? feeReceivedVia || undefined : undefined,
        payment_method_uuid: paymentMethodUuid,
        paid_amount: effectivePaidAmount,
        notes: notes || undefined,
      });

      if (result.status === 'success' && result.data) {
        toast.success('Transaksi berhasil dibuat');
        router.push('/app/pos/bank-agent-transactions');
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Transaksi Agen Bank</h1>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kiri: pilih Jenis Transaksi -- pola sama dgn Server Pulsa/PPOB
              (panel pilih di kiri, detail/checkout di kanan). List-nya scroll
              sendiri + ada search, supaya tetap nyaman dipakai walau jenis
              transaksinya banyak (Setor/Tarik Tunai, Transfer, Bayar
              BPJS/Listrik/dst, dll). */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Transaksi <span className="text-red-500">*</span></label>
              <p
                className={`text-xs text-gray-400 mb-3 ${
                  selectedType && !isTypeListOpen ? 'hidden lg:block' : ''
                }`}
              >
                Klik salah satu untuk memilih.
              </p>
              {types.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada jenis transaksi -- tambah dulu lewat tombol &quot;Jenis Transaksi&quot; di halaman daftar Agen Bank.</p>
              ) : (
                <>
                  {/* Ringkasan pilihan -- hanya mobile, menggantikan daftar
                      panjang begitu satu jenis dipilih. */}
                  {selectedType && !isTypeListOpen && (
                    <div className="lg:hidden flex items-center justify-between gap-3 rounded-lg border border-[#EBC170] bg-[#FDF6E9] px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
                        {selectedType.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsTypeListOpen(true)}
                        className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                      >
                        Ganti
                      </button>
                    </div>
                  )}

                  <div
                    className={`min-h-0 flex-1 flex-col ${
                      selectedType && !isTypeListOpen ? 'hidden lg:flex' : 'flex'
                    }`}
                  >
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
                  <div className="space-y-2 flex-1 min-h-40 max-h-72 lg:max-h-none overflow-y-auto pr-1">
                    {filteredTypes.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Tidak ada jenis transaksi yang cocok.</p>
                    ) : (
                      filteredTypes.map((type) => {
                        const isSelected = type.uuid === transactionTypeUuid;
                        return (
                          <button
                            key={type.uuid}
                            type="button"
                            onClick={() => {
                              setTransactionTypeUuid(type.uuid);
                              setIsTypeListOpen(false);
                            }}
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
                  </div>
                </>
              )}
              {fieldErrors.transactionTypeUuid && <div className="mt-2 text-sm text-red-600">{fieldErrors.transactionTypeUuid[0]}</div>}
            </div>
          </div>

          {/* Kanan: detail transaksi & pembayaran */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionTitle>Transaksi</SectionTitle>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cabang <span className="text-red-500">*</span></label>
                  <select
                    value={branchUuid}
                    onChange={(e) => setBranchUuid(e.target.value)}
                    className={fieldClass(!!fieldErrors.branchUuid)}
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((branch) => (
                      <option key={branch.uuid} value={branch.uuid}>{branch.code ? `${branch.code} - ` : ''}{branch.name}</option>
                    ))}
                  </select>
                  {fieldErrors.branchUuid && <div className="mt-1 text-sm text-red-600">{fieldErrors.branchUuid[0]}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Akun Agen Bank <span className="text-red-500">*</span></label>
                  <select
                    value={accountUuid}
                    onChange={(e) => setAccountUuid(e.target.value)}
                    className={fieldClass(!!fieldErrors.saldoAccountUuid)}
                  >
                    <option value="">Pilih Akun</option>
                    {accountOptions.map((account) => (
                      <option key={account.uuid} value={account.uuid}>{account.name}</option>
                    ))}
                  </select>
                  {accountOptions.length === 0 && (
                    <p className="mt-1 text-xs text-gray-400">Belum ada akun yang ditandai untuk Agen Bank -- centang di menu Saldo &gt; Edit Akun dulu.</p>
                  )}
                  {fieldErrors.saldoAccountUuid && <div className="mt-1 text-sm text-red-600">{fieldErrors.saldoAccountUuid[0]}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">No. Rekening Tujuan/Asal (opsional)</label>
                  <input
                    type="text"
                    value={accountReference}
                    onChange={(e) => setAccountReference(e.target.value)}
                    className={fieldClass()}
                    placeholder="Nomor rekening customer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nominal <span className="text-red-500">*</span></label>
                  <RupiahInput
                    value={baseAmount}
                    onChange={setBaseAmount}
                    hasError={!!fieldErrors.baseAmount}
                  />
                  {fieldErrors.baseAmount && <div className="mt-1 text-sm text-red-600">{fieldErrors.baseAmount[0]}</div>}
                </div>

                <SectionTitle>Komisi &amp; Biaya</SectionTitle>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Komisi</label>
                  <RupiahInput value={fee} onChange={setFee} />
                </div>

                {!isWithdrawal && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Diterima dari Pelanggan <span className="text-red-500">*</span></label>
                      <button type="button" onClick={handleAutoSellingAmount} className="text-xs text-[#142D52] hover:underline cursor-pointer">
                        Isi otomatis (Nominal + Komisi)
                      </button>
                    </div>
                    <RupiahInput
                      value={sellingAmount}
                      onChange={setSellingAmount}
                      hasError={!!fieldErrors.sellingAmount}
                    />
                    {fieldErrors.sellingAmount && <div className="mt-1 text-sm text-red-600">{fieldErrors.sellingAmount[0]}</div>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Biaya Admin Bank (kosongkan kalau tidak ada)</label>
                  <RupiahInput value={adminFee} onChange={setAdminFee} />
                  <p className="mt-1 text-xs text-gray-500">
                    Biaya layanan yang dipotong bank dari saldo akun Agen Bank ini — ditanggung toko, bukan dibayar pelanggan.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Jangan diisi potongan yang memotong rekening/ATM pelanggan (mis. biaya transfer antar bank yang langsung terpotong dari rekening pelanggan) — itu bukan beban toko.
                  </p>
                  {(feeNumber > 0 || adminFeeNumber > 0) && (
                    <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
                      <p className="text-xs text-gray-500">Laba Bersih (komisi − biaya admin bank)</p>
                      <p className={`text-base font-bold ${netProfit === 0 ? 'text-gray-400' : netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(netProfit)}
                      </p>
                    </div>
                  )}
                </div>

                {isWithdrawal && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Komisi Diterima Via{feeNumber > 0 && <span className="text-red-500"> *</span>}
                    </label>
                    <select
                      value={feeReceivedVia}
                      onChange={(e) => setFeeReceivedVia(e.target.value)}
                      className={fieldClass(!!fieldErrors.feeReceivedVia)}
                    >
                      <option value="">Pilih</option>
                      <option value="deducted">Dipotong dari Tunai</option>
                      <option value="cash">Tunai Terpisah</option>
                      <option value="balance">Ikut Rekening</option>
                    </select>
                    {fieldErrors.feeReceivedVia && <div className="mt-1 text-sm text-red-600">{fieldErrors.feeReceivedVia[0]}</div>}
                  </div>
                )}

                <SectionTitle>Pembayaran</SectionTitle>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metode Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethodUuid}
                    onChange={(e) => setPaymentMethodUuid(e.target.value)}
                    className={fieldClass(!!fieldErrors.paymentMethodUuid)}
                  >
                    <option value="">Pilih Metode Pembayaran</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.uuid} value={pm.uuid}>{pm.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">
                    {isWithdrawal ? 'Akun kas yang dipakai buat menyerahkan tunai ke customer.' : 'Akun kas yang menerima pembayaran dari customer.'}
                  </p>
                  {fieldErrors.paymentMethodUuid && <div className="mt-1 text-sm text-red-600">{fieldErrors.paymentMethodUuid[0]}</div>}
                </div>

                {!isWithdrawal && isCashPayment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Uang Diterima</label>
                    <RupiahInput value={paidAmount} onChange={setPaidAmount} />
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
                  className={`${fieldClass()} resize-none`}
                  placeholder="Opsional"
                />
              </div>

              {/* Di mobile baris aksi menempel di dasar layar (sticky) supaya
                  tombol Simpan selalu terjangkau tanpa menggulir ke ujung form
                  yang panjang -- pola yang biasa dipakai aplikasi HP. Mulai sm
                  kembali jadi baris biasa rata kanan seperti semula. */}
              <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex items-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:mb-0 sm:justify-end sm:space-x-3 sm:rounded-none sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4 sm:backdrop-blur-none">
                <Link href="/app/pos/bank-agent-transactions" className="shrink-0">
                  <Button type="button" variant="light" icon={X}>Batal</Button>
                </Link>
                <div className="flex-1 sm:flex-none">
                  <Button type="submit" variant="warning" icon={Save} isLoading={isLoading} className="w-full sm:w-auto">Simpan</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
