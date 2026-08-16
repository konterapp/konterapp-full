'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  Percent,
  Ticket,
  X as XIcon,
  Zap,
} from 'lucide-react';
import {
  getBillingStatus,
  createCheckoutInvoice,
  applyCoupon,
  BillingStatus,
  CouponApplyResult,
} from '@/lib/api/app/billing';
import { useToast } from '@/components/toast/ToastContainer';

const PLANS = [
  {
    code: 'monthly',
    name: 'Bulanan',
    price: 10000,
    durationLabel: '/ bulan',
    equivalentLabel: '30 hari akses penuh',
    badge: null,
  },
  {
    code: 'yearly',
    name: 'Tahunan',
    price: 99000,
    durationLabel: '/ tahun',
    equivalentLabel: 'setara Rp8.250/bulan',
    badge: 'Paling Hemat',
  },
];

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

const planFeatures = [
  'Semua fitur Free Trial',
  'Pengguna tanpa batas',
  'Multi cabang & multi kasir',
  'Laporan laba-rugi detail',
  'Prioritas dukungan 24 jam',
  'Struk dengan nama toko sendiri',
];

export default function UpgradePage() {
  const toast = useToast();
  const [data, setData] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplyResult | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const plan = PLANS.find((p) => p.code === selectedPlan) ?? PLANS[1];

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

  const handleSelectPlan = (code: string) => {
    if (code === selectedPlan) return;
    setSelectedPlan(code);
    // Kupon divalidasi ulang terhadap paket yang dipilih.
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim();
    if (!trimmed) {
      toast.error('Masukkan kode kupon terlebih dahulu');
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const response = await applyCoupon(trimmed, selectedPlan);
      if (response.status === 'success' && response.data) {
        setAppliedCoupon(response.data);
        toast.success(`Kupon ${response.data.code} berhasil digunakan`);
      } else {
        setAppliedCoupon(null);
        toast.error(response.message || 'Kode kupon tidak dapat digunakan');
      }
    } catch {
      toast.error('Terjadi kesalahan, silakan coba lagi');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handlePay = async () => {
    setIsCheckingOut(true);
    try {
      const response = await createCheckoutInvoice(selectedPlan, appliedCoupon?.code ?? null);
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

  const subscription = data?.subscription;
  const subtotal = appliedCoupon?.subtotal ?? plan.price;
  const finalAmount = appliedCoupon?.final_amount ?? plan.price;
  const alreadyActive = !!subscription && subscription.status === 'active';

  return (
    <div className="space-y-6">
      <Link
        href="/app/billing"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Langganan
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Upgrade Paket Berbayar</h1>
        <p className="text-gray-600 mt-1">
          Pilih paket dan selesaikan pembayaran untuk mengaktifkan semua fitur.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8 text-gray-500">Memuat data...</div>
        </div>
      ) : alreadyActive ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Paket {subscription.plan.name} Anda sudah aktif
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Berakhir pada {formatDate(subscription.expires_at)}. Tidak perlu melakukan pembayaran lagi.
          </p>
          <Link
            href="/app/billing"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-[#142D52] hover:bg-[#0B1E3A] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Langganan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Detail paket */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#142D52] px-6 py-5">
              <h2 className="text-lg font-semibold text-white">Pilih Paket</h2>
              <p className="text-sm text-gray-300 mt-1">
                Pilih masa langganan yang sesuai dengan kebutuhan usaha Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {PLANS.map((item) => {
                const active = item.code === selectedPlan;
                return (
                  <button
                    key={item.code}
                    onClick={() => handleSelectPlan(item.code)}
                    className={`relative text-left border rounded-xl p-5 transition-all cursor-pointer ${
                      active
                        ? 'border-[#EBC170] bg-[#EBC170]/10 ring-2 ring-[#EBC170]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-[#EBC170] text-[#142D52] text-[10px] font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          active ? 'border-[#142D52]' : 'border-gray-300'
                        }`}
                      >
                        {active && <span className="w-2 h-2 bg-[#142D52] rounded-full" />}
                      </span>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    </div>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-gray-500 mb-1">{item.durationLabel}</span>
                    </div>
                    <p className="text-xs text-gray-500">{item.equivalentLabel}</p>
                  </button>
                );
              })}
            </div>

            <ul className="px-6 py-5 space-y-3 border-t border-gray-100">
              {planFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            {subscription && (
              <div className="mx-6 mb-5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-700">
                Langganan saat ini:{' '}
                <span className="font-medium">
                  {subscription.plan.name} (hingga {formatDate(subscription.expires_at)})
                </span>
                . Sisa masa aktif akan ditambahkan ke periode paket baru.
              </div>
            )}
          </div>

          {/* Ringkasan pembayaran */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kupon */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#142D52]" />
                Punya Kupon Diskon?
              </h3>
              {appliedCoupon ? (
                <div className="mt-4 flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-lg">
                      <Percent className="w-4 h-4" />
                      {appliedCoupon.discount_percent}%
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 font-mono">{appliedCoupon.code}</p>
                      <p className="text-xs text-gray-600">
                        Diskon {formatCurrency(appliedCoupon.discount_amount)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Contoh: RAYA2026"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] text-sm uppercase cursor-text"
                    maxLength={50}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="px-5 py-2 bg-[#142D52] hover:bg-[#0B1E3A] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
                  >
                    {isApplyingCoupon ? 'Memeriksa...' : 'Pakai'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pembayaran</h2>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Paket {plan.name}</dt>
                  <dd className="font-medium text-gray-900">{formatCurrency(subtotal)}</dd>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-green-700">
                    <dt className="flex items-center gap-1.5">
                      <Ticket className="w-4 h-4" />
                      Kupon {appliedCoupon.code}
                    </dt>
                    <dd className="font-semibold">
                      -{formatCurrency(appliedCoupon.discount_amount)}
                    </dd>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                  <dt className="text-gray-900 font-semibold">Total Bayar</dt>
                  <dd className="text-xl font-bold text-[#142D52]">{formatCurrency(finalAmount)}</dd>
                </div>
              </dl>

              <button
                onClick={handlePay}
                disabled={isCheckingOut}
                className="w-full mt-6 px-6 py-3.5 bg-[#142D52] hover:bg-[#0B1E3A] text-white font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {isCheckingOut ? 'Memproses...' : `Bayar & Aktifkan Paket ${plan.name}`}
              </button>

              <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Pembayaran diproses aman melalui Midtrans (Virtual Account, QRIS, e-Wallet).
              </p>
            </div>

            <div className="bg-[#EBC170]/15 border border-[#EBC170]/40 rounded-lg px-4 py-3 text-sm text-[#142D52]/80 flex items-start gap-2">
              <Zap className="w-4 h-4 mt-0.5 shrink-0 text-[#142D52]" />
              <span>
                Langganan aktif otomatis setelah pembayaran terkonfirmasi. Anda tidak perlu
                menghubungi dukungan.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
