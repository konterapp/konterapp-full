'use client';

import { use, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Calendar, Building2, Landmark, CreditCard, User, FileText } from 'lucide-react';
import { getBankAgentTransaction, BankAgentTransaction } from '@/lib/api/app/bank-agent-transaction';

const FEE_RECEIVED_VIA_LABELS: Record<string, string> = {
  deducted: 'Dipotong dari Tunai',
  cash: 'Tunai Terpisah',
  balance: 'Ikut Rekening',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function BankAgentTransactionDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const resolvedParams = use(params);
  const [transaction, setTransaction] = useState<BankAgentTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resolvedParams.uuid) {
      fetchTransaction(resolvedParams.uuid);
    }
  }, [resolvedParams.uuid]);

  const fetchTransaction = async (uuid: string) => {
    try {
      setIsLoading(true);
      setError('');
      const result = await getBankAgentTransaction(uuid);
      if (result.status === 'success' && result.data) {
        setTransaction(result.data);
      } else {
        setError(result.message || 'Transaksi tidak ditemukan');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-600">{error || 'Transaksi tidak ditemukan'}</p>
            <Link href="/app/pos/bank-agent-transactions" className="text-[#EBC170] hover:underline">
              Kembali ke daftar Agen Bank
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isWithdrawal = transaction.cash_direction === 'in';

  return (
    <div className="space-y-6">
      {/* Di mobile judul, nomor transaksi, dan badge jenis dipaksa sebaris
          sehingga judul maupun badge sama-sama pecah jadi dua baris dan saling
          berhimpitan. Sekarang badge turun ke baris sendiri di bawah nomor
          transaksi; mulai sm kembali ke satu baris rata kanan seperti semula. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 sm:items-center sm:space-x-4">
          <Link
            href="/app/pos/bank-agent-transactions"
            aria-label="Kembali ke Agen Bank"
            className="-ml-2 inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-gray-100 sm:ml-0"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-[#142D52]">Detail Transaksi Agen Bank</h1>
            <p className="mt-0.5 sm:mt-1 truncate font-mono text-sm sm:font-sans sm:text-base text-gray-600">
              {transaction.transaction_number}
            </p>
          </div>
        </div>
        <span
          className={`self-start whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold sm:self-auto ${
            transaction.cash_direction === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {transaction.transaction_type?.name || '-'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informasi Transaksi</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start space-x-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p className="text-sm font-medium text-gray-900">{formatDateTime(transaction.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Cabang</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.branch?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Landmark className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Akun Agen Bank</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.account?.name || '-'}</p>
                  {transaction.account_reference && (
                    <p className="text-xs text-gray-500">No. Rekening: {transaction.account_reference}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CreditCard className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Metode Pembayaran</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.payment_method?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Kasir</p>
                  <p className="text-sm font-medium text-gray-900">{transaction.creator?.name || '-'}</p>
                </div>
              </div>

              {isWithdrawal && transaction.fee_received_via && (
                <div className="flex items-start space-x-3">
                  <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Komisi Diterima Via</p>
                    <p className="text-sm font-medium text-gray-900">
                      {FEE_RECEIVED_VIA_LABELS[transaction.fee_received_via] || transaction.fee_received_via}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {transaction.notes && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-start space-x-3">
                  <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Catatan</p>
                    <p className="mt-1 text-sm text-gray-700">{transaction.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Ringkasan</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-sm font-semibold text-gray-900">Nominal</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(transaction.base_amount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Diterima dari Pelanggan</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(transaction.selling_amount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uang Diterima</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(transaction.paid_amount)}</span>
              </div>

              {transaction.change_amount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kembalian</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(transaction.change_amount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-600">Komisi</span>
                <span className="text-sm font-medium text-gray-900">{transaction.fee > 0 ? formatCurrency(transaction.fee) : '-'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Biaya Admin Bank</span>
                <span className="text-sm font-medium text-red-600">
                  {transaction.admin_fee > 0 ? `- ${formatCurrency(transaction.admin_fee)}` : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm font-semibold text-gray-900">Laba Bersih</span>
                <span className={`text-lg font-bold ${transaction.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(transaction.net_profit)}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">Dibuat: {formatDateTime(transaction.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
