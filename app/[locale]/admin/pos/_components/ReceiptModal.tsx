'use client';

import { useState } from 'react';
import { X, Printer, Share2 } from 'lucide-react';

interface SaleItem {
  product: {
    name: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface Sale {
  saleNumber: string;
  createdAt?: string;
  creator?: {
    name: string;
  };
  customer?: {
    name: string;
  };
  paymentMethod?: {
    name: string;
  };
  subtotal?: number;
  discountAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
  notes?: string;
  items?: SaleItem[];
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Partial<Sale> | null;
}

export default function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Struk Transaksi</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h4 className="text-xl font-bold text-gray-900">KonterApp</h4>
            <p className="text-sm text-gray-500 mt-1">Solusi Kasir & PPOB Terlengkap</p>
          </div>

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">No. Invoice</span>
              <span className="font-medium text-gray-900">{sale.saleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal</span>
              <span className="text-gray-900">{sale.createdAt ? formatDate(sale.createdAt) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kasir</span>
              <span className="text-gray-900">{sale.creator?.name || '-'}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pelanggan</span>
                <span className="text-gray-900">{sale.customer.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Metode Bayar</span>
              <span className="text-gray-900">{sale.paymentMethod?.name || '-'}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {/* Items */}
          <div className="space-y-3">
            {sale.items?.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <div className="text-right">
                  {item.discount > 0 && (
                    <p className="text-xs text-red-500">-{formatCurrency(item.discount)}</p>
                  )}
                  <p className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatCurrency(sale.subtotal || 0)}</span>
            </div>
            {sale.discountAmount && sale.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Diskon</span>
                <span className="text-red-500">-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCurrency(sale.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bayar</span>
              <span className="text-gray-900">{formatCurrency(sale.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kembali</span>
              <span className="text-green-600 font-medium">{formatCurrency(sale.changeAmount || 0)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-4"></div>

          {sale.notes && (
            <div className="text-sm">
              <span className="text-gray-500">Catatan: </span>
              <span className="text-gray-900">{sale.notes}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 no-print">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#142D52] text-white rounded-lg hover:bg-[#1a3a6a] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
