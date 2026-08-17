'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, Copy, Check, Users, Wallet, TrendingUp, Mail } from 'lucide-react';
import { getReferralDashboard, ReferralDashboard } from '@/lib/api/app/referral';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

import { REFERRAL_DISCOUNT_PERCENT, REFERRAL_COMMISSION_PERCENT } from '@/lib/modules/referral/constants';

export default function ReferralPage() {
  const [data, setData] = useState<ReferralDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getReferralDashboard();
    if (res.status === 'success' && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareUrl =
    typeof window !== 'undefined' && data
      ? `${window.location.origin}/register?ref=${data.referral_code}`
      : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#142D52]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52] flex items-center gap-2">
          <Gift className="w-6 h-6" />
          Program Referral
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Ajak teman mendaftar pakai kode referral Anda. Mereka dapat diskon
          langganan {REFERRAL_DISCOUNT_PERCENT}% dan Anda dapat komisi {REFERRAL_COMMISSION_PERCENT}%
          dari pembayaran pertama mereka — masuk ke saldo, bisa dipakai untuk perpanjang
          langganan Anda sendiri.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Saldo Referral"
          value={formatCurrency(data?.referral_balance ?? 0)}
          tone="text-[#142D52]"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Referral"
          value={String(data?.stats.total_referrals ?? 0)}
          tone="text-amber-600"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Total Komisi"
          value={formatCurrency(data?.stats.total_commission ?? 0)}
          tone="text-green-600"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Kode Referral Anda</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
            <span className="text-lg font-bold tracking-widest text-[#142D52]">
              {data?.referral_code ?? '—'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#142D52] hover:text-[#0B1E3A] cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-3 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] transition-colors cursor-pointer text-sm"
          >
            Salin Link Daftar
          </button>
        </div>
        {shareUrl && (
          <p className="mt-2 text-xs text-gray-500 break-all">{shareUrl}</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Daftar Teman Direferensikan
        </h2>
        {data && data.referrals.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {data.referrals.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#142D52]/10 flex items-center justify-center text-[#142D52]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      r.verified
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {r.verified ? 'Terverifikasi' : 'Belum'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(r.joined_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-6 text-center">
            Belum ada teman yang memakai kode referral Anda.
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Riwayat Komisi</h2>
        {data && data.commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4 font-medium">Temannya</th>
                  <th className="py-2 pr-4 font-medium">Paket</th>
                  <th className="py-2 pr-4 font-medium">Pembayaran</th>
                  <th className="py-2 pr-4 font-medium text-right">Komisi ({REFERRAL_COMMISSION_PERCENT}%)</th>
                  <th className="py-2 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.commissions.map((c) => (
                  <tr key={c.uuid}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-800">{c.referred.name}</p>
                      <p className="text-xs text-gray-500">{c.referred.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{c.plan_code}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatCurrency(c.base_amount)}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-green-600">
                      +{formatCurrency(c.amount)}
                    </td>
                    <td className="py-3 text-gray-500">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-6 text-center">
            Belum ada komisi. Komisi {REFERRAL_COMMISSION_PERCENT}% diberikan otomatis saat
            referral Anda melakukan pembayaran langganan pertama.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}