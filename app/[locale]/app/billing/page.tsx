'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, CheckCircle2, Clock, XCircle, Zap } from 'lucide-react';
import { getBillingStatus, createCheckoutInvoice, BillingStatus } from '@/lib/api/app/billing';
import { useToast } from '@/components/toast/ToastContainer';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const statusBadge: Record<string, { label: string; className: string }> = {
  trial: { label: 'Free Trial', className: 'bg-blue-100 text-blue-700' },
  active: { label: 'Aktif', className: 'bg-green-100 text-green-700' },
  expired: { label: 'Berakhir', className: 'bg-red-100 text-red-700' },
  canceled: { label: 'Dibatalkan', className: 'bg-gray-100 text-gray-600' },
};

const invoiceStatusIcon: Record<string, React.ReactNode> = {
  paid: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  expired: <XCircle className="w-4 h-4 text-gray-400" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function BillingPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const upgradeIntent = searchParams.get('upgrade') === 'yearly';
  const [data, setData] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getBillingStatus();
      if (response.status === 'success' && response.data) {
        setData(response.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleUpgrade = async () => {
    setIsCheckingOut(true);
    try {
      const response = await createCheckoutInvoice();
      if (response.status === 'success' && response.data?.payment_link) {
        window.location.href = response.data.payment_link;
      } else {
        toast.error(response.message || 'Gagal membuat invoice pembayaran');
      }
    } catch {
      toast.error('Terjadi kesalahan, silakan coba lagi');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      </div>
    );
  }

  const subscription = data?.subscription;
  const badge = subscription ? statusBadge[subscription.status] ?? statusBadge.expired : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Langganan</h1>
        <p className="text-gray-600 mt-1">Kelola paket langganan perusahaan Anda.</p>
      </div>

      {/* Banner intent upgrade dari landing */}
      {upgradeIntent && subscription && subscription.plan.code !== 'yearly' && (
        <div className="bg-[#EBC170] border border-[#d6af63] rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4 shadow-sm">
          <div className="flex-1">
            <h3 className="font-bold text-[#142D52] flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Anda memilih Paket Tahunan
            </h3>
            <p className="text-sm text-[#142D52]/80 mt-1">
              Selesaikan pembayaran Rp99.000 untuk mengaktifkan semua fitur paket Tahunan.
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={isCheckingOut}
            className="px-6 py-3 bg-[#142D52] hover:bg-[#0B1E3A] text-white font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {isCheckingOut ? 'Memproses...' : 'Bayar & Aktifkan Sekarang'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {subscription ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900">{subscription.plan.name}</h2>
                {badge && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Berlaku {formatDate(subscription.started_at)} &ndash; {formatDate(subscription.expires_at)}
              </p>
            </div>

            {subscription.plan.code !== 'yearly' && (
              <button
                onClick={handleUpgrade}
                disabled={isCheckingOut}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold disabled:opacity-60 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                {isCheckingOut ? 'Memproses...' : 'Upgrade ke Tahunan - Rp99.000'}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada informasi langganan untuk perusahaan Anda.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Pembayaran</h2>
        {data?.invoices && data.invoices.length > 0 ? (
          <div className="space-y-3">
            {data.invoices.map((invoice) => (
              <div
                key={invoice.uuid}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {invoiceStatusIcon[invoice.status] ?? <Clock className="w-4 h-4 text-gray-400" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{invoice.plan.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</p>
                  {invoice.status === 'pending' && invoice.payment_link && (
                    <a
                      href={invoice.payment_link}
                      className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-[#142D52] hover:bg-[#0B1E3A] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Lanjutkan Pembayaran
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Belum ada riwayat pembayaran.</p>
        )}
      </div>
    </div>
  );
}
