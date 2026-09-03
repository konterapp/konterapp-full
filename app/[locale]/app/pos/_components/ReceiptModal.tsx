'use client';

import { X, Printer } from 'lucide-react';

interface ReceiptSaleItem {
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  product?: { uuid?: string; name?: string };
}

interface ReceiptSale {
  sale_number?: string;
  sale_date?: string;
  branch?: { name?: string };
  customer?: { name?: string };
  payment_method?: { name?: string };
  items?: ReceiptSaleItem[];
  subtotal?: number;
  discount_amount?: number;
  total_amount?: number;
  paid_amount?: number;
  change_amount?: number;
  payment_status?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  sale: ReceiptSale | null;
  onClose: () => void;
  onNewTransaction: () => void;
}

export default function ReceiptModal({ isOpen, sale, onClose, onNewTransaction }: ReceiptModalProps) {
  if (!isOpen || !sale) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const outstandingAmount = Math.max(Number(sale.total_amount || 0) - Number(sale.paid_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* max-h pakai dvh supaya di HP tinggi address bar ikut dihitung dan
          baris tombol (Cetak / Transaksi Baru) tidak terdorong keluar layar. */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90dvh] overflow-y-auto">
        {/* Header - hide on print */}
        <div className="sticky top-0 flex items-center justify-between bg-white p-4 border-b print:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Struk Transaksi</h2>
          <button onClick={onClose} aria-label="Tutup struk" className="-mr-1.5 flex h-10 w-10 items-center justify-center hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-4 sm:p-6" id="receipt-content">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold">KONTERAPP</h3>
            {sale.branch && <p className="text-sm text-gray-600">{sale.branch.name}</p>}
            <div className="border-b border-dashed border-gray-300 mt-3" />
          </div>

          <div className="text-sm space-y-1 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">No. Transaksi:</span>
              <span className="font-medium">{sale.sale_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tanggal:</span>
              <span>{formatDate(sale.sale_date)}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pelanggan:</span>
                <span>{sale.customer.name}</span>
              </div>
            )}
            {sale.payment_method && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pembayaran:</span>
                <span>{sale.payment_method.name}</span>
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-gray-300 mb-3" />

          {/* Items */}
          <div className="space-y-2 mb-3">
            {sale.items?.map((item, index) => (
              <div key={item.product?.uuid || index} className="text-sm">
                <p className="font-medium">{item.product?.name || 'Produk'}</p>
                <div className="flex justify-between text-gray-600">
                  <span>{item.quantity} x {formatCurrency(Number(item.unit_price))}</span>
                  <span>{formatCurrency(Number(item.subtotal))}</span>
                </div>
                {Number(item.discount) > 0 && (
                  <div className="flex justify-between text-gray-500 text-xs">
                    <span>Diskon:</span>
                    <span>-{formatCurrency(Number(item.discount))}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-gray-300 mb-3" />

          {/* Summary */}
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(Number(sale.subtotal))}</span>
            </div>
            {Number(sale.discount_amount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Diskon:</span>
                <span>-{formatCurrency(Number(sale.discount_amount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
              <span>Total:</span>
              <span>{formatCurrency(Number(sale.total_amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bayar:</span>
              <span>{formatCurrency(Number(sale.paid_amount))}</span>
            </div>
            {outstandingAmount > 0 ? (
              <div className="flex justify-between font-medium">
                <span className="text-gray-600">Sisa Piutang:</span>
                <span>{formatCurrency(outstandingAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between font-medium">
                <span className="text-gray-600">Kembalian:</span>
                <span>{formatCurrency(Number(sale.change_amount))}</span>
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-gray-300 mt-4 mb-3" />

          <p className="text-center text-xs text-gray-500">Terima kasih atas kunjungan Anda!</p>
        </div>

        {/* Actions - hide on print */}
        <div className="sticky bottom-0 flex gap-3 bg-white p-4 border-t print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 min-h-11 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
          <button
            type="button"
            onClick={onNewTransaction}
            className="flex-1 min-h-11 px-4 py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold cursor-pointer"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
