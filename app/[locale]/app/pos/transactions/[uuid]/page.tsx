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
      const response = await fetch(`/api/app/pos/transactions/${uuid}`);
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
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      pending: 'Belum Dibayar',
      partial: 'Dibayar Sebagian',
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
            <Link href="/app/pos/transactions" className="text-[#EBC170] hover:underline">
              Kembali ke daftar transaksi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const outstandingAmount = Math.max(Number(sale.total_amount) - Number(sale.paid_amount), 0);

  return (
    <div className="space-y-6">
      {/* Di mobile judul & baris aksi ditumpuk. Dipaksa sebaris, tombol
          "Cetak Ulang" plus badge status mendorong nomor transaksi sampai
          terpotong di tepi kanan layar. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/app/pos/transactions"
            aria-label="Kembali ke daftar transaksi"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#142D52]">Detail Transaksi</h1>
            <p className="mt-1 truncate text-sm sm:text-base text-gray-600">{sale.sale_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 font-medium transition-colors hover:bg-gray-50 sm:flex-none"
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span>Cetak Ulang</span>
          </button>
          <div className="shrink-0">{getStatusBadge(sale.payment_status)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
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

          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Item Transaksi</h2>

            {/* Mobile: tiap item jadi kartu. Sebagai tabel 6 kolom, kolom
                Subtotal terdorong keluar layar HP sehingga angka yang paling
                dicari justru harus digeser dulu. Kolom "No" sengaja dibuang di
                sini -- cuma nomor urut, tidak menambah informasi. */}
            <div className="divide-y divide-gray-100 lg:hidden">
              {sale.items?.map((item) => (
                <div key={item.uuid} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    {/* min-w-0 wajib: tanpa itu flex child menolak menyusut &
                        nama produk panjang bikin overflow horizontal. */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.product?.name || '-'}</p>
                      {item.product?.sku && <p className="truncate text-xs text-gray-500">{item.product.sku}</p>}
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-gray-900">{formatCurrency(Number(item.subtotal))}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{item.quantity} &times; {formatCurrency(Number(item.unit_price))}</span>
                    {Number(item.discount) > 0 && (
                      <span className="text-red-600">Diskon {formatCurrency(Number(item.discount))}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
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
          {/* sticky baru mulai lg: di mobile panel ini ditumpuk di bawah dan
              sticky-nya tidak ada gunanya. */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm lg:sticky lg:top-6">
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

              {outstandingAmount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sisa Piutang</span>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(outstandingAmount)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kembalian</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(Number(sale.change_amount))}</span>
                </div>
              )}

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
