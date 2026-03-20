'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PpobProductLocal, PpobInquiryResult, PpobTransaction, inquiryBill, purchasePrepaid, payPostpaid } from '@/lib/api/admin/ppob';
import { Branch } from '@/lib/api/admin/branch';
import { PaymentMethod } from '@/lib/api/admin/payment-method';

interface TransactionPanelProps {
  selectedProduct: PpobProductLocal | null;
  activeGroup: string;
  activeType: 'prepaid' | 'postpaid';
  branches: Branch[];
  paymentMethods: PaymentMethod[];
  selectedBranch: string;
  onBranchChange: (uuid: string) => void;
  onCustomerNumberChange?: (number: string) => void;
  onTransactionComplete: (transaction: PpobTransaction) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
}

export default function TransactionPanel({
  selectedProduct,
  activeGroup,
  activeType,
  branches,
  paymentMethods,
  selectedBranch,
  onBranchChange,
  onCustomerNumberChange,
  onTransactionComplete,
}: TransactionPanelProps) {
  const [customerNumber, setCustomerNumber] = useState('');
  const [sellingPriceInput, setSellingPriceInput] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<PpobInquiryResult | null>(null);
  const [transactionResult, setTransactionResult] = useState<PpobTransaction | null>(null);
  const [error, setError] = useState('');
  const [bpjsPeriode, setBpjsPeriode] = useState('');

  // Default payment method ke Tunai (type: cash)
  useEffect(() => {
    if (!selectedPaymentMethod && paymentMethods.length > 0) {
      const cash = paymentMethods.find((pm) => pm.type === 'cash');
      if (cash) setSelectedPaymentMethod(cash.uuid);
    }
  }, [paymentMethods]);

  const sellingPrice = sellingPriceInput ? Number(sellingPriceInput) : 0;
  const productPrice = selectedProduct ? Number(selectedProduct.selling_price) : 0;

  const resetForm = () => {
    setCustomerNumber('');
    setSellingPriceInput('');
    setNotes('');
    setInquiryResult(null);
    setTransactionResult(null);
    setError('');
    setBpjsPeriode('');
  };

  const handleInquiry = async () => {
    if (!selectedProduct || !customerNumber) return;
    setIsLoading(true);
    setError('');
    setInquiryResult(null);

    try {
      const result = await inquiryBill(
        selectedProduct.provider_product_code,
        customerNumber,
        undefined,
        undefined,
        activeGroup === 'BPJS' ? bpjsPeriode || '1' : undefined,
      );

      if (result.STATUS === '00') {
        setInquiryResult(result as PpobInquiryResult);
        const tagihan = Number(result.TAGIHAN || result.TOTAL || 0);
        const admin = Number(result.ADMIN || 0);
        setSellingPriceInput(String(tagihan + admin));
      } else {
        setError(String(result.KET || 'Gagal melakukan inquiry'));
      }
    } catch {
      setError('Gagal menghubungi server');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProduct || !customerNumber || !selectedBranch || !selectedPaymentMethod) return;
    setIsLoading(true);
    setError('');

    try {
      const result = await purchasePrepaid({
        branch_uuid: selectedBranch,
        product_code: selectedProduct.provider_product_code,
        product_name: selectedProduct.product_name,
        customer_number: customerNumber,
        amount: Number(selectedProduct.base_price),
        selling_price: sellingPrice || productPrice,
        payment_method_uuid: selectedPaymentMethod,
        notes: notes || undefined,
      });

      if (result.status === 'success' && result.data) {
        setTransactionResult(result.data);
        onTransactionComplete(result.data);
      } else {
        setError(result.message || 'Gagal memproses transaksi');
      }
    } catch {
      setError('Gagal menghubungi server');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedProduct || !inquiryResult || !selectedBranch || !selectedPaymentMethod) return;
    setIsLoading(true);
    setError('');

    const tagihan = Number(inquiryResult.TAGIHAN || inquiryResult.TOTAL || 0);
    const admin = Number(inquiryResult.ADMIN || 0);

    try {
      const result = await payPostpaid({
        branch_uuid: selectedBranch,
        product_code: selectedProduct.provider_product_code,
        product_name: selectedProduct.product_name,
        customer_number: customerNumber,
        customer_name: String(inquiryResult.NAMA || ''),
        amount: tagihan,
        admin_fee: admin,
        selling_price: sellingPrice || (tagihan + admin),
        nominal: String(tagihan),
        payment_method_uuid: selectedPaymentMethod,
        ref2: String(inquiryResult.REF2 || ''),
        ref3: String(inquiryResult.REF3 || ''),
        bpjs_idpel1: activeGroup === 'BPJS' ? String(inquiryResult.IDPEL1 || '') : undefined,
        no_hp: activeGroup === 'BPJS' ? customerNumber : undefined,
        notes: notes || undefined,
      });

      if (result.status === 'success' && result.data) {
        setTransactionResult(result.data);
        onTransactionComplete(result.data);
      } else {
        setError(result.message || 'Gagal memproses pembayaran');
      }
    } catch {
      setError('Gagal menghubungi server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewTransaction = () => {
    resetForm();
    setTransactionResult(null);
  };

  // Transaction result view
  if (transactionResult) {
    const statusIcon = transactionResult.status === 'success'
      ? <CheckCircle2 className="w-12 h-12 text-green-500" />
      : transactionResult.status === 'failed'
      ? <XCircle className="w-12 h-12 text-red-500" />
      : <Clock className="w-12 h-12 text-yellow-500" />;

    const statusText = transactionResult.status_label || transactionResult.status;
    const statusColor = transactionResult.status === 'success' ? 'text-green-600' : transactionResult.status === 'failed' ? 'text-red-600' : 'text-yellow-600';

    return (
      <div className="flex flex-col items-center gap-4 p-6">
        {statusIcon}
        <div className={`text-lg font-bold ${statusColor}`}>Transaksi {statusText}</div>
        <div className="w-full space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">No. Transaksi</span>
            <span className="font-medium">{transactionResult.transaction_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Produk</span>
            <span className="font-medium">{transactionResult.product_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">No. Pelanggan</span>
            <span className="font-medium">{transactionResult.customer_number}</span>
          </div>
          {transactionResult.customer_name && (
            <div className="flex justify-between">
              <span className="text-gray-500">Nama</span>
              <span className="font-medium">{transactionResult.customer_name}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Harga Jual</span>
              <span className="font-bold text-[#142D52]">{formatPrice(Number(transactionResult.selling_price))}</span>
            </div>
          </div>
          {transactionResult.provider_reference && (
            <div className="flex justify-between">
              <span className="text-gray-500">Referensi</span>
              <span className="font-mono text-xs">{transactionResult.provider_reference}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleNewTransaction}
          className="w-full mt-4 py-2.5 bg-[#142D52] text-white rounded-lg font-medium hover:bg-[#142D52]/90 transition-colors"
        >
          Transaksi Baru
        </button>
      </div>
    );
  }

  const isPostpaid = activeType === 'postpaid';
  const canProcess = selectedProduct && customerNumber && selectedBranch && selectedPaymentMethod && !isLoading;
  const canProcessPostpaid = canProcess && inquiryResult;

  return (
    <div className="flex flex-col gap-4">
      {/* Branch selector */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Cabang</label>
        <select
          value={selectedBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142D52]/20 focus:border-[#142D52]"
        >
          <option value="">Pilih Cabang</option>
          {branches.map((b) => (
            <option key={b.uuid} value={b.uuid}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Selected product info */}
      {selectedProduct ? (
        <div className="bg-[#142D52]/5 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">Produk dipilih</div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              selectedProduct.provider === 'rajabiller'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {selectedProduct.provider === 'rajabiller' ? 'RajaBiller' : 'Digiflazz'}
            </span>
          </div>
          <div className="font-medium text-[#142D52]">{selectedProduct.product_name}</div>
          <div className="text-xs text-gray-500">{selectedProduct.provider_product_code} &middot; {activeType === 'prepaid' ? 'Prabayar' : 'Pascabayar'}</div>
          <div className="text-sm font-semibold mt-1">{formatPrice(productPrice)}</div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-400">
          Pilih produk terlebih dahulu
        </div>
      )}

      {/* Customer number */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {isPostpaid ? 'ID Pelanggan / No. Meter' : 'No. HP / Tujuan'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customerNumber}
            onChange={(e) => { setCustomerNumber(e.target.value); onCustomerNumberChange?.(e.target.value); }}
            placeholder={isPostpaid ? 'Masukkan ID pelanggan...' : 'Masukkan nomor HP...'}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142D52]/20 focus:border-[#142D52] placeholder-gray-400"
          />
          {isPostpaid && (
            <button
              onClick={handleInquiry}
              disabled={!selectedProduct || !customerNumber || isLoading}
              className="px-3 py-2 bg-[#EBC170] text-gray-900 rounded-lg text-sm font-medium hover:bg-[#EBC170]/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cek
            </button>
          )}
        </div>
      </div>

      {/* BPJS Periode */}
      {activeGroup === 'BPJS' && isPostpaid && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Periode BPJS</label>
          <input
            type="text"
            value={bpjsPeriode}
            onChange={(e) => setBpjsPeriode(e.target.value)}
            placeholder="Contoh: 1 (jumlah bulan)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142D52]/20 focus:border-[#142D52] placeholder-gray-400"
          />
        </div>
      )}

      {/* Inquiry result (postpaid) */}
      {inquiryResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
          <div className="text-xs font-medium text-green-800">Hasil Inquiry</div>
          {inquiryResult.NAMA && (
            <div className="text-sm"><span className="text-gray-500">Nama:</span> {inquiryResult.NAMA}</div>
          )}
          <div className="text-sm">
            <span className="text-gray-500">Tagihan:</span> {formatPrice(Number(inquiryResult.TAGIHAN || inquiryResult.TOTAL || 0))}
          </div>
          {Number(inquiryResult.ADMIN || 0) > 0 && (
            <div className="text-sm"><span className="text-gray-500">Admin:</span> {formatPrice(Number(inquiryResult.ADMIN))}</div>
          )}
          <div className="text-sm font-semibold">
            <span className="text-gray-500">Total:</span> {formatPrice(Number(inquiryResult.TAGIHAN || inquiryResult.TOTAL || 0) + Number(inquiryResult.ADMIN || 0))}
          </div>
        </div>
      )}

      {/* Selling price */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Harga Jual</label>
        <input
          type="number"
          value={sellingPriceInput}
          onChange={(e) => setSellingPriceInput(e.target.value)}
          placeholder={productPrice ? formatPrice(productPrice) : '0'}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142D52]/20 focus:border-[#142D52] placeholder-gray-400"
        />
        {(sellingPrice || productPrice) > 0 && selectedProduct && (
          <div className="text-xs text-gray-400 mt-1">
            Profit: {formatPrice((sellingPrice || productPrice) - Number(selectedProduct.base_price) - Number(selectedProduct.admin_fee))}
          </div>
        )}
      </div>

      {/* Payment method */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Metode Pembayaran</label>
        <div className="flex flex-wrap gap-1.5">
          {paymentMethods.map((pm) => (
            <button
              key={pm.uuid}
              type="button"
              onClick={() => setSelectedPaymentMethod(pm.uuid)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                selectedPaymentMethod === pm.uuid
                  ? 'border-[#142D52] bg-[#142D52] text-white font-semibold'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
              }`}
            >
              {pm.name}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Catatan (opsional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan tambahan..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#142D52]/20 focus:border-[#142D52] placeholder-gray-400"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Process button */}
      <button
        onClick={isPostpaid ? handlePayment : handlePurchase}
        disabled={isPostpaid ? !canProcessPostpaid : !canProcess}
        className="w-full py-3 bg-[#EBC170] text-gray-900 rounded-lg font-bold text-sm hover:bg-[#EBC170]/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Memproses...
          </>
        ) : isPostpaid ? (
          'Bayar Tagihan'
        ) : (
          'Proses Pembelian'
        )}
      </button>
    </div>
  );
}
