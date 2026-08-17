'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  CreditCard,
  Lock,
  Percent,
  Store,
  Ticket,
  Users,
  Wallet,
  X as XIcon,
  Zap,
} from 'lucide-react';
import {
  getBillingStatus,
  getPlans,
  createCheckoutInvoice,
  applyCoupon,
  BillingStatus,
  CouponApplyResult,
  PlanTier,
} from '@/lib/api/app/billing';
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

const PERIODS: { code: 'monthly' | 'yearly'; label: string }[] = [
  { code: 'monthly', label: 'Bulanan' },
  { code: 'yearly', label: 'Tahunan' },
];

const savingsPercent = (monthly: number, yearly: number) =>
  Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);

export default function UpgradePage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BillingStatus | null>(null);
  const [tiers, setTiers] = useState<PlanTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTierCode, setSelectedTierCode] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplyResult | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [useSaldo, setUseSaldo] = useState(false);

  useEffect(() => {
    const intentTier = searchParams.get('tier');
    const intentPeriod = searchParams.get('period');
    if (intentPeriod === 'monthly' || intentPeriod === 'yearly') {
      setSelectedPeriod(intentPeriod);
    }
    if (intentTier) {
      setSelectedTierCode(intentTier);
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statusRes, plansRes] = await Promise.all([getBillingStatus(), getPlans()]);
      if (statusRes.status === 'success' && statusRes.data) {
        setData(statusRes.data);
      }
      if (plansRes.status === 'success' && plansRes.data) {
        setTiers(plansRes.data);
        setSelectedTierCode((prev) => prev ?? plansRes.data?.find((t) => t.code !== 'free')?.code ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedTier = tiers.find((t) => t.code === selectedTierCode) ?? null;
  const selectedPlan =
    selectedTier?.plans.find((p) => p.billing_period === selectedPeriod) ?? selectedTier?.plans[0] ?? null;
  const selectedMonthlyPlan = selectedTier?.plans.find((p) => p.billing_period === 'monthly') ?? null;
  const selectedYearlyPlan = selectedTier?.plans.find((p) => p.billing_period === 'yearly') ?? null;
  const yearlySavings =
    selectedMonthlyPlan && selectedYearlyPlan
      ? savingsPercent(selectedMonthlyPlan.price, selectedYearlyPlan.price)
      : null;

  const handleSelectTier = (code: string) => {
    if (code === selectedTierCode) return;
    setSelectedTierCode(code);
    // Kupon divalidasi ulang terhadap paket yang dipilih.
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleSelectPeriod = (period: 'monthly' | 'yearly') => {
    if (period === selectedPeriod) return;
    setSelectedPeriod(period);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim();
    if (!trimmed || !selectedPlan) {
      toast.error('Masukkan kode kupon terlebih dahulu');
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const response = await applyCoupon(trimmed, selectedPlan.code);
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
    if (!selectedPlan) return;
    setIsCheckingOut(true);
    try {
      const response = await createCheckoutInvoice(
        selectedPlan.code,
        appliedCoupon?.code ?? null,
        useSaldo
      );
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
  const isFirstPaidSub = !data?.invoices.some((i) => i.status === 'paid');
  const referralAutoActive = Boolean(data?.referred_by) && isFirstPaidSub && !appliedCoupon;
  const referralBalance = data?.referral_balance ?? 0;

  const subtotal = selectedPlan?.price ?? 0;
  const discountAmount =
    appliedCoupon?.discount_amount ??
    (referralAutoActive && selectedPlan ? Math.round((selectedPlan.price * 10) / 100) : 0);
  const amountAfterDiscount = Math.max(subtotal - discountAmount, 0);
  const saldoUsed = useSaldo ? Math.min(referralBalance, amountAfterDiscount) : 0;
  const finalAmount = Math.max(amountAfterDiscount - saldoUsed, 0);
  const alreadyActive =
    !!subscription &&
    subscription.status === 'active' &&
    subscription.plan?.billing_period !== null;

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
          Pilih tier yang sesuai dengan skala usaha Anda, lalu selesaikan pembayaran.
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
            Berakhir pada {subscription.expires_at ? formatDate(subscription.expires_at) : 'Selamanya (Free)'}. Tidak perlu melakukan pembayaran lagi.
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
          {/* Pilih tier */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#142D52] px-6 py-5">
              <h2 className="text-lg font-semibold text-white">Pilih Paket</h2>
              <p className="text-sm text-gray-300 mt-1">
                Bandingkan batasan tiap paket sesuai kebutuhan usaha Anda.
              </p>
            </div>

            <div className="flex items-center gap-2 px-6 pt-5">
              <span className="text-sm text-gray-500 mr-1">Periode:</span>
              {PERIODS.map((period) => {
                const active = period.code === selectedPeriod;
                return (
                  <button
                    key={period.code}
                    onClick={() => handleSelectPeriod(period.code)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      active ? 'bg-[#142D52] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {period.label}
                    {period.code === 'yearly' && active && yearlySavings != null && (
                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#EBC170] text-[#142D52] text-[9px] font-bold rounded-full">
                        Hemat {yearlySavings}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {tiers.map((tier) => {
                const active = tier.code === selectedTierCode;
                const isFree = tier.code === 'free';
                const periodPlan = tier.plans.find((p) => p.billing_period === selectedPeriod) ?? tier.plans[0];
                const monthlyPlan = tier.plans.find((p) => p.billing_period === 'monthly');
                const yearlyPlan = tier.plans.find((p) => p.billing_period === 'yearly');
                return (
                  <button
                    key={tier.uuid}
                    onClick={() => handleSelectTier(tier.code)}
                    className={`relative text-left border rounded-xl p-5 transition-all cursor-pointer flex flex-col ${
                      active
                        ? 'border-[#EBC170] bg-[#EBC170]/10 ring-2 ring-[#EBC170]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {tier.code === 'growth' && (
                      <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-[#EBC170] text-[#142D52] text-[10px] font-bold rounded-full">
                        Populer
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          active ? 'border-[#142D52]' : 'border-gray-300'
                        }`}
                      >
                        {active && <span className="w-2 h-2 bg-[#142D52] rounded-full" />}
                      </span>
                      <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                    </div>
                    {tier.description && (
                      <p className="text-xs text-gray-500 ml-6 mb-2">{tier.description}</p>
                    )}
                    <div className="mb-3 ml-6">
                      {isFree ? (
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-gray-900">Rp0</span>
                          <span className="text-gray-500 mb-1">/ selamanya</span>
                        </div>
                      ) : selectedPeriod === 'yearly' && yearlyPlan ? (
                        <div>
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">
                              {formatCurrency(Math.round(yearlyPlan.price / 12))}
                            </span>
                            <span className="text-gray-500 mb-1">/bulan</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-base text-gray-400 line-through">
                              {formatCurrency(monthlyPlan?.price ?? 0)}
                            </span>
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                              Hemat {savingsPercent(monthlyPlan?.price ?? 0, yearlyPlan.price)}%
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">
                            dibayar {formatCurrency(yearlyPlan.price)} per tahun
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatCurrency(periodPlan?.price ?? 0)}
                          </span>
                          <span className="text-gray-500 mb-1">/bulan</span>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-1.5 flex-1">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" />
                        {tier.max_branches == null ? 'Cabang tanpa batas' : `${tier.max_branches} cabang`}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {tier.max_users == null ? 'User tanpa batas' : `${tier.max_users} user`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {subscription && (
              <div className="mx-6 mb-5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-700">
                Langganan saat ini:{' '}
                <span className="font-medium">
                  {subscription.plan.name} {subscription.expires_at ? `(hingga ${formatDate(subscription.expires_at)})` : '(selamanya)'}
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
                {referralAutoActive ? 'Diskon Referral Aktif' : 'Punya Kupon / Kode Referral?'}
              </h3>
              {referralAutoActive ? (
                <div className="mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-sm font-semibold rounded-lg">
                    <Percent className="w-4 h-4" />
                    10%
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Diskon Referral Otomatis</p>
                    <p className="text-xs text-gray-600">
                      Diskon {formatCurrency(discountAmount)} untuk pembayaran langganan pertama Anda.
                    </p>
                  </div>
                </div>
              ) : appliedCoupon ? (
                <div className="mt-4 flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-lg">
                      <Percent className="w-4 h-4" />
                      {appliedCoupon.discount_percent}%
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 font-mono">{appliedCoupon.code}</p>
                      <p className="text-xs text-gray-600">
                        {appliedCoupon.is_referral ? 'Referral' : 'Kupon'} · Diskon {formatCurrency(appliedCoupon.discount_amount)}
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
                    disabled={isApplyingCoupon || !selectedPlan}
                    className="px-5 py-2 bg-[#142D52] hover:bg-[#0B1E3A] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
                  >
                    {isApplyingCoupon ? 'Memeriksa...' : 'Pakai'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pembayaran</h2>

              {selectedTier?.code === 'free' ? (
                <div className="text-sm text-gray-600">
                  Paket Free gratis selamanya. Pilih paket berbayar untuk
                  menambah cabang & pengguna.
                </div>
              ) : (
                <>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-600">
                        Paket {selectedTier?.name} {selectedPeriod === 'monthly' ? 'Bulanan' : 'Tahunan'}
                      </dt>
                      <dd className="font-medium text-gray-900">{formatCurrency(subtotal)}</dd>
                    </div>

                    {(appliedCoupon || referralAutoActive) && (
                      <div className="flex items-center justify-between text-green-700">
                        <dt className="flex items-center gap-1.5">
                          <Percent className="w-4 h-4" />
                          {referralAutoActive ? 'Diskon Referral' : `Kupon ${appliedCoupon!.code}`}
                        </dt>
                        <dd className="font-semibold">
                          -{formatCurrency(discountAmount)}
                        </dd>
                      </div>
                    )}

                    {referralBalance > 0 && !finalAmount && (
                      <div className="flex items-center justify-between text-gray-500 text-xs italic">
                        <dt>Pembayaran sudah covered oleh diskon. Tidak perlu bayar.</dt>
                      </div>
                    )}

                    {referralBalance > 0 && (
                      <div className="pt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSaldo}
                            onChange={(e) => setUseSaldo(e.target.checked)}
                            disabled={finalAmount === 0}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#142D52] focus:ring-[#EBC170] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              Gunakan Saldo Referral ({formatCurrency(referralBalance)})
                            </span>
                            <p className="text-xs text-gray-500">
                              Saldo hanya dapat digunakan untuk perpanjangan langganan sendiri.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {saldoUsed > 0 && (
                      <div className="flex items-center justify-between text-green-700">
                        <dt className="flex items-center gap-1.5">
                          <Wallet className="w-4 h-4" />
                          Saldo Referral
                        </dt>
                        <dd className="font-semibold">
                          -{formatCurrency(saldoUsed)}
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
                    {isCheckingOut
                      ? 'Memproses...'
                      : `Bayar & Aktifkan Paket ${selectedTier?.name}`}
                  </button>
                </>
              )}

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
