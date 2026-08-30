'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
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
  const [transactionType, setTransactionType] = useState('');
  const [accountReference, setAccountReference] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [fee, setFee] = useState('');
  const [adminFee, setAdminFee] = useState('');
  const [feeReceivedVia, setFeeReceivedVia] = useState('');
  const [paymentMethodUuid, setPaymentMethodUuid] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');

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
        if (result.status === 'success') setTypes(result.data || []);
      })
      .catch(() => {});

    getPaymentMethodOptions()
      .then((result) => {
        if (result.status === 'success') setPaymentMethods(result.data || []);
      })
      .catch(() => {});
  }, []);

  const accountOptions = accounts.filter((a) => a.is_bank_agent);
  const selectedType = types.find((t) => t.code === transactionType);
  const isWithdrawal = selectedType?.cash_direction === 'in';
  const selectedPaymentMethod = paymentMethods.find((pm) => pm.uuid === paymentMethodUuid);
  const isCashPayment = selectedPaymentMethod?.type === 'cash';

  const baseAmountNumber = Number(baseAmount) || 0;
  const feeNumber = Number(fee) || 0;
  const sellingAmountNumber = Number(sellingAmount) || 0;
  const paidAmountNumber = Number(paidAmount) || 0;

  // Tarik Tunai: bukan customer yang bayar, jadi tidak ada konsep "diterima
  // dari pelanggan"/kembalian -- nominal kena tunai dihitung otomatis di
  // backend sesuai "Komisi Diterima Via". Field ini tetap dikirim (dipakai
  // utk pencatatan), cuma tidak ditampilkan di form.
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
        transaction_type: transactionType,
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Transaksi Agen Bank</h1>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Akun Agen Bank <span className="text-red-500">*</span></label>
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
              <p className="mt-1 text-xs text-gray-400">Belum ada akun yang ditandai untuk Agen Bank -- centang di menu Saldo &gt; Edit Akun dulu.</p>
            )}
            {fieldErrors.saldoAccountUuid && <div className="mt-1 text-sm text-red-600">{fieldErrors.saldoAccountUuid[0]}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Transaksi <span className="text-red-500">*</span></label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.transactionType ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
            >
              <option value="">Pilih Jenis Transaksi</option>
              {types.map((type) => (
                <option key={type.code} value={type.code}>{type.label}</option>
              ))}
            </select>
            {fieldErrors.transactionType && <div className="mt-1 text-sm text-red-600">{fieldErrors.transactionType[0]}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">No. Rekening Tujuan/Asal (opsional)</label>
            <input
              type="text"
              value={accountReference}
              onChange={(e) => setAccountReference(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
              placeholder="Nomor rekening customer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nominal <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.baseAmount ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
              placeholder="0"
            />
            {fieldErrors.baseAmount && <div className="mt-1 text-sm text-red-600">{fieldErrors.baseAmount[0]}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Komisi</label>
            <input
              type="number"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
              placeholder="0"
            />
          </div>

          {!isWithdrawal && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Diterima dari Pelanggan <span className="text-red-500">*</span></label>
                <button type="button" onClick={handleAutoSellingAmount} className="text-xs text-[#142D52] hover:underline cursor-pointer">
                  Isi otomatis (Nominal + Komisi)
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={sellingAmount}
                onChange={(e) => setSellingAmount(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.sellingAmount ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
                placeholder="0"
              />
              {fieldErrors.sellingAmount && <div className="mt-1 text-sm text-red-600">{fieldErrors.sellingAmount[0]}</div>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Biaya Admin Bank (opsional)</label>
            <input
              type="number"
              min="0"
              value={adminFee}
              onChange={(e) => setAdminFee(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
              placeholder="0"
            />
          </div>

          {isWithdrawal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Komisi Diterima Via{feeNumber > 0 && <span className="text-red-500"> *</span>}
              </label>
              <select
                value={feeReceivedVia}
                onChange={(e) => setFeeReceivedVia(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.feeReceivedVia ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
              >
                <option value="">Pilih</option>
                <option value="deducted">Dipotong dari Tunai</option>
                <option value="cash">Tunai Terpisah</option>
                <option value="balance">Ikut Rekening</option>
              </select>
              {fieldErrors.feeReceivedVia && <div className="mt-1 text-sm text-red-600">{fieldErrors.feeReceivedVia[0]}</div>}
            </div>
          )}

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
              {isWithdrawal ? 'Akun kas yang dipakai buat menyerahkan tunai ke customer.' : 'Akun kas yang menerima pembayaran dari customer.'}
            </p>
            {fieldErrors.paymentMethodUuid && <div className="mt-1 text-sm text-red-600">{fieldErrors.paymentMethodUuid[0]}</div>}
          </div>

          {!isWithdrawal && isCashPayment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Uang Diterima</label>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
                placeholder="0"
              />
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
          <Link href="/app/pos/bank-agent-transactions">
            <Button type="button" variant="light" icon={X}>Batal</Button>
          </Link>
          <Button type="submit" variant="warning" icon={Save} isLoading={isLoading}>Simpan</Button>
        </div>
      </form>
    </div>
  );
}
