'use client';

import { use, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Calendar, Building2, CreditCard, User, FileText, Printer } from 'lucide-react';
import ReceiptModal from '../../_components/ReceiptModal';

interface SaleItem {
  uuid: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  product?: {
    uuid: string;
    name: string;
    sku?: string;
  };
}

interface Sale {
  uuid: string;
  sale_number: string;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_status: string;
  notes?: string | null;
  branch?: { uuid: string; name: string };
  customer?: { uuid: string; name: string; phone?: string | null };
  payment_method?: { uuid: string; name: string };
  creator?: { id: number; name: string; email: string };
  created_at?: string;
  items?: SaleItem[];
}

export default function TransactionDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const resolvedParams = use(params);
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (resolvedParams.uuid) {
      fetchSale(resolvedParams.uuid);
    }
  }, [resolvedParams.uuid]);

  const fetchSale = async (uuid: string) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`/api/admin/pos/transactions/${uuid}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setSale(result.data);
      } else {
        setError(result.message || 'Transaksi tidak ditemukan');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      pending: 'Belum Dibayar',
      paid: 'Lunas',
    };
    return (
      <span className={`rounded-full px-3 py-1 text-sm font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
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

  if (error || !sale) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-600">{error || 'Transaksi tidak ditemukan'}</p>
            <Link href="/admin/pos/transactions" className="text-[#EBC170] hover:underline">
              Kembali ke daftar transaksi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/pos/transactions" className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#142D52]">Detail Transaksi</h1>
            <p className="mt-1 text-gray-600">{sale.sale_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex cursor-pointer items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 font-medium transition-colors hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Ulang</span>
          </button>
          {getStatusBadge(sale.payment_status)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informasi Transaksi</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start space-x-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tanggal Transaksi</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(sale.sale_date)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Cabang</p>
                  <p className="text-sm font-medium text-gray-900">{sale.branch?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Pelanggan</p>
                  <p className="text-sm font-medium text-gray-900">{sale.customer?.name || 'Walk-in'}</p>
                  {sale.customer?.phone && <p className="text-xs text-gray-500">{sale.customer.phone}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CreditCard className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Metode Pembayaran</p>
                  <p className="text-sm font-medium text-gray-900">{sale.payment_method?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Kasir</p>
                  <p className="text-sm font-medium text-gray-900">{sale.creator?.name || '-'}</p>
                  <p className="text-xs text-gray-500">{sale.creator?.email || ''}</p>
                </div>
              </div>
            </div>

            {sale.notes && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-start space-x-3">
                  <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Catatan</p>
                    <p className="mt-1 text-sm text-gray-700">{sale.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Item Transaksi</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Produk</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Harga Jual</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Diskon</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sale.items?.map((item, index) => (
                    <tr key={item.uuid}>
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.product?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{item.product?.sku || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(Number(item.unit_price))}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {Number(item.discount) > 0 ? formatCurrency(Number(item.discount)) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(Number(item.subtotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Ringkasan</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(Number(sale.subtotal))}</span>
              </div>

              {Number(sale.discount_amount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Diskon</span>
                  <span className="text-sm font-medium text-red-600">-{formatCurrency(Number(sale.discount_amount))}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(Number(sale.total_amount))}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dibayar</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(Number(sale.paid_amount))}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kembalian</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(Number(sale.change_amount))}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge(sale.payment_status)}
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">
                  Dibuat: {sale.created_at ? new Date(sale.created_at).toLocaleString('id-ID') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal
        isOpen={showReceipt}
        sale={sale}
        onClose={() => setShowReceipt(false)}
        onNewTransaction={() => setShowReceipt(false)}
      />
    </div>
  );
}
