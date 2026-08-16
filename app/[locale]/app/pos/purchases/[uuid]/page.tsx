'use client';

import { use, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Building2, Calendar, FileText, Pencil, Truck, User } from 'lucide-react';

interface PurchaseItem {
  uuid: string;
  quantity: number;
  unit: string;
  factor_to_base: number;
  quantity_base: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  product?: {
    uuid: string;
    name: string;
    sku?: string | null;
    unit?: string | null;
  } | null;
}

interface Purchase {
  uuid: string;
  purchase_number: string;
  purchase_date: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: string;
  notes?: string | null;
  branch?: { uuid: string; name: string; code?: string | null } | null;
  supplier?: { uuid: string; name: string; code?: string | null; phone?: string | null } | null;
  creator?: { id: number; name: string; email: string } | null;
  created_at?: string;
  items?: PurchaseItem[];
}

export default function PurchaseDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const resolvedParams = use(params);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resolvedParams.uuid) {
      fetchPurchase(resolvedParams.uuid);
    }
  }, [resolvedParams.uuid]);

  const fetchPurchase = async (uuid: string) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`/api/app/pos/purchases/${uuid}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setPurchase(result.data);
      } else {
        setError(result.message || 'Data pembelian tidak ditemukan');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      void: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending: 'Belum Dibayar',
      partial: 'Dibayar Sebagian',
      paid: 'Lunas',
      void: 'Void',
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

  if (error || !purchase) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-600">{error || 'Data pembelian tidak ditemukan'}</p>
            <Link href="/app/pos/purchases" className="text-[#EBC170] hover:underline">
              Kembali ke daftar pembelian
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
          <Link href="/app/pos/purchases" className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#142D52]">Detail Pembelian</h1>
            <p className="mt-1 text-gray-600">{purchase.purchase_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {purchase.payment_status === 'draft' && (
            <Link
              href={`/app/pos/purchases/${purchase.uuid}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
            >
              <Pencil className="h-4 w-4" />
              <span>Edit Draft</span>
            </Link>
          )}
          {getStatusBadge(purchase.payment_status)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informasi Pembelian</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start space-x-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tanggal Pembelian</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(purchase.purchase_date)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Building2 className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Cabang</p>
                  <p className="text-sm font-medium text-gray-900">{purchase.branch?.name || '-'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Truck className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Supplier</p>
                  <p className="text-sm font-medium text-gray-900">{purchase.supplier?.name || 'Tanpa Supplier'}</p>
                  <p className="text-xs text-gray-500">{purchase.supplier?.code || ''}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Dibuat Oleh</p>
                  <p className="text-sm font-medium text-gray-900">{purchase.creator?.name || '-'}</p>
                  <p className="text-xs text-gray-500">{purchase.creator?.email || ''}</p>
                </div>
              </div>
            </div>

            {purchase.notes && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-start space-x-3">
                  <FileText className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Catatan</p>
                    <p className="mt-1 text-sm text-gray-700">{purchase.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Item Pembelian</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Produk</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Qty Base</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Harga Beli</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Diskon</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {purchase.items?.map((item, index) => (
                    <tr key={item.uuid}>
                      <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.product?.name || '-'}</p>
                        <p className="text-xs text-gray-500">
                          {item.product?.sku || '-'}{item.product?.unit ? ` • ${item.product.unit}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {item.quantity} {item.unit}
                        <p className="text-xs text-gray-500">x{Number(item.factor_to_base || 1)}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{item.quantity_base}</td>
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
                <span className="text-sm font-medium text-gray-900">{formatCurrency(Number(purchase.subtotal))}</span>
              </div>

              {Number(purchase.discount_amount) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Diskon</span>
                  <span className="text-sm font-medium text-red-600">-{formatCurrency(Number(purchase.discount_amount))}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(Number(purchase.total_amount))}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dibayar</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(Number(purchase.paid_amount))}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sisa Hutang</span>
                <span className="text-sm font-semibold text-red-600">{formatCurrency(Number(purchase.outstanding_amount))}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge(purchase.payment_status)}
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">
                  Dibuat: {purchase.created_at ? new Date(purchase.created_at).toLocaleString('id-ID') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
