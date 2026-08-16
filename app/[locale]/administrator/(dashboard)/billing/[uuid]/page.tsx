'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Building2, CreditCard, FileText, Hash, Link2, RefreshCw, Ticket } from 'lucide-react';
import { getBillingInvoice, AdminBillingInvoice } from '@/lib/api/administrator/billing';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusBadge: Record<string, { label: string; className: string }> = {
  paid: { label: 'Lunas', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Menunggu', className: 'bg-amber-100 text-amber-700' },
  expired: { label: 'Kedaluwarsa', className: 'bg-gray-100 text-gray-600' },
  failed: { label: 'Gagal', className: 'bg-red-100 text-red-700' },
};

export default function BillingDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const [invoice, setInvoice] = useState<AdminBillingInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvoice = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getBillingInvoice(uuid);

      if (response.status === 'success' && response.data) {
        setInvoice(response.data);
      } else {
        setError(response.message || 'Gagal memuat detail transaksi');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [uuid]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Link
          href="/administrator/billing"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Transaksi Billing</span>
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Transaksi tidak ditemukan'}
        </div>
      </div>
    );
  }

  const badge = statusBadge[invoice.status] ?? { label: invoice.status, className: 'bg-gray-100 text-gray-600' };

  const detailRows = [
    { icon: <FileText className="w-4 h-4 text-gray-400" />, label: 'Provider', value: invoice.provider || '-' },
    { icon: <Hash className="w-4 h-4 text-gray-400" />, label: 'ID Invoice', value: invoice.provider_invoice_id },
    { icon: <Hash className="w-4 h-4 text-gray-400" />, label: 'ID Transaksi', value: invoice.provider_transaction_id || '-' },
    ...(invoice.coupon_code
      ? [
          {
            icon: <Ticket className="w-4 h-4 text-gray-400" />,
            label: 'Kupon',
            value: `${invoice.coupon_code}${invoice.discount_amount != null ? ` (-${formatCurrency(invoice.discount_amount)})` : ''}`,
          },
        ]
      : []),
    { icon: <CreditCard className="w-4 h-4 text-gray-400" />, label: 'Nominal', value: formatCurrency(invoice.amount) },
    { icon: <RefreshCw className="w-4 h-4 text-gray-400" />, label: 'Dibuat', value: formatDateTime(invoice.created_at) },
    { icon: <RefreshCw className="w-4 h-4 text-gray-400" />, label: 'Dibayar', value: formatDateTime(invoice.paid_at) },
    { icon: <RefreshCw className="w-4 h-4 text-gray-400" />, label: 'Kedaluwarsa', value: formatDateTime(invoice.expired_at) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/administrator/billing"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Transaksi Billing</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Detail Transaksi</h1>
        <p className="text-gray-600 mt-1">Informasi lengkap transaksi pembayaran langganan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{invoice.plan.name}</h2>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          <dl className="divide-y divide-gray-100">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between py-3 gap-4">
                <dt className="flex items-center gap-2 text-sm text-gray-500">
                  {row.icon}
                  {row.label}
                </dt>
                <dd className="text-sm font-medium text-gray-900 text-right break-all">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Perusahaan</h2>
          {invoice.company ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{invoice.company.name}</span>
              </div>
              <p className="text-sm font-mono text-gray-500">{invoice.company.code}</p>
              <Link
                href={`/administrator/companies/${invoice.company.uuid}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] text-gray-900 hover:bg-[#d4ab5f] rounded-lg transition-colors text-xs font-medium mt-3 cursor-pointer"
              >
                Lihat Perusahaan
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Data perusahaan tidak ditemukan</p>
          )}

          {invoice.payment_link && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Link Pembayaran</h3>
              <a
                href={invoice.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#142D52] hover:underline cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                Buka link pembayaran
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
