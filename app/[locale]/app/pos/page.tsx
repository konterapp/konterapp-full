'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Search, Plus, Minus, Trash2, Package, Camera, X, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { getProducts, Product, ProductImageData, lookupBarcode } from '@/lib/api/app/product';
import { getPaymentMethodOptions, PaymentMethodOption as PaymentMethod } from '@/lib/api/app/saldo';
import { getShiftBranchSaldo, BranchSaldoItem } from '@/lib/api/app/branch';
import { Customer } from '@/lib/api/app/customer';
import { createSale, Sale, SaleItemCreateData } from '@/lib/api/app/sale';
import CustomerSelect from './_components/CustomerSelect';
import ReceiptModal from './_components/ReceiptModal';
import BarcodeScanner from './_components/BarcodeScanner';

interface CartItem {
  id: number;
  product_uuid: string;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  product_images: ProductImageData[];
  unit_price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  available_stock: number;
}

interface BranchOption {
  uuid: string;
  name: string;
  code?: string;
  is_main?: boolean;
  max_concurrent_users?: number;
  open_shift_count?: number;
}

interface ActiveShift {
  uuid: string;
  opened_at: string;
  current_total_sales: number;
  branch: {
    uuid: string;
    name: string;
    code?: string;
  } | null;
}

interface ClosedShiftSummary {
  uuid: string;
  closed_at: string | null;
  total_sales: number;
  branch: {
    uuid: string;
    name: string;
    code?: string;
  } | null;
}

export default function KasirPage() {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [isShiftLoading, setIsShiftLoading] = useState(true);
  const [isSubmittingShift, setIsSubmittingShift] = useState(false);
  const [isSubmittingCloseShift, setIsSubmittingCloseShift] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [recentlyClosedShift, setRecentlyClosedShift] = useState<ClosedShiftSummary | null>(null);
  const [openShiftForm, setOpenShiftForm] = useState({
    branch_uuid: '',
    notes_open: '',
  });
  const [closeShiftForm, setCloseShiftForm] = useState({
    notes_close: '',
  });
  const [openShiftSaldo, setOpenShiftSaldo] = useState<{
    isLoading: boolean;
    error: string;
    items: BranchSaldoItem[];
    totalBalance: number;
  }>({ isLoading: false, error: '', items: [], totalBalance: 0 });
  const [closeShiftSaldo, setCloseShiftSaldo] = useState<{
    isLoading: boolean;
    error: string;
    items: BranchSaldoItem[];
    totalBalance: number;
  }>({ isLoading: false, error: '', items: [], totalBalance: 0 });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [nextCartId, setNextCartId] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanNotification, setScanNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const barcodeBufferRef = useRef('');
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [imageGallery, setImageGallery] = useState<{ images: string[]; name: string; index: number } | null>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const loadShiftState = useCallback(async () => {
    setIsShiftLoading(true);
    try {
      const response = await fetch('/api/app/pos/shifts?page=1&per_page=10');
      const result = await response.json();

      if (result.status !== 'success' || !result.data) {
        throw new Error(result.message || 'Gagal memuat status shift');
      }

      const branchItems = Array.isArray(result.data.filters?.branches)
        ? result.data.filters.branches
        : [];
      setBranches(branchItems);

      const active = result.data.active_shift || null;
      setActiveShift(active);

      if (active?.branch?.uuid) {
        setSelectedBranch(active.branch.uuid);
        setRecentlyClosedShift(null);
        setOpenShiftForm((prev) => ({ ...prev, branch_uuid: active.branch.uuid }));
      } else {
        const defaultBranch = branchItems.find((item: BranchOption) => item.is_main) || branchItems[0];
        setSelectedBranch('');
        setOpenShiftForm((prev) => ({
          ...prev,
          branch_uuid: prev.branch_uuid || defaultBranch?.uuid || '',
        }));
        setCloseShiftForm({ notes_close: '' });
      }
    } catch (err) {
      console.error('Failed to load shift state:', err);
      setActiveShift(null);
      setBranches([]);
    } finally {
      setIsShiftLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadShiftState();
        const paymentMethodsRes = await getPaymentMethodOptions();
        if (paymentMethodsRes.data) {
          const paymentItems = paymentMethodsRes.data || [];
          setPaymentMethods(paymentItems);
          const cashMethod = paymentItems.find(pm => pm.type === 'cash');
          if (cashMethod) setSelectedPaymentMethod(cashMethod.uuid);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, [loadShiftState]);

  useEffect(() => {
    if (activeShift || !openShiftForm.branch_uuid) {
      setOpenShiftSaldo({ isLoading: false, error: '', items: [], totalBalance: 0 });
      return;
    }
    let cancelled = false;
    setOpenShiftSaldo((prev) => ({ ...prev, isLoading: true, error: '' }));
    getShiftBranchSaldo(openShiftForm.branch_uuid)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 'success' && res.data) {
          setOpenShiftSaldo({
            isLoading: false,
            error: '',
            items: res.data.data || [],
            totalBalance: res.data.total_balance || 0,
          });
        } else {
          setOpenShiftSaldo({ isLoading: false, error: res.message || 'Gagal memuat saldo cabang', items: [], totalBalance: 0 });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setOpenShiftSaldo({ isLoading: false, error: 'Gagal memuat saldo cabang', items: [], totalBalance: 0 });
      });
    return () => { cancelled = true; };
  }, [openShiftForm.branch_uuid, activeShift]);

  useEffect(() => {
    if (!showCloseShiftModal || !activeShift?.branch?.uuid) {
      setCloseShiftSaldo({ isLoading: false, error: '', items: [], totalBalance: 0 });
      return;
    }
    let cancelled = false;
    setCloseShiftSaldo((prev) => ({ ...prev, isLoading: true, error: '' }));
    getShiftBranchSaldo(activeShift.branch.uuid)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 'success' && res.data) {
          setCloseShiftSaldo({
            isLoading: false,
            error: '',
            items: res.data.data || [],
            totalBalance: res.data.total_balance || 0,
          });
        } else {
          setCloseShiftSaldo({ isLoading: false, error: res.message || 'Gagal memuat saldo cabang', items: [], totalBalance: 0 });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCloseShiftSaldo({ isLoading: false, error: 'Gagal memuat saldo cabang', items: [], totalBalance: 0 });
      });
    return () => { cancelled = true; };
  }, [showCloseShiftModal, activeShift?.branch?.uuid]);

  const searchProducts = useCallback(async (query: string) => {
    if (!selectedBranch || !activeShift) return;
    setIsSearching(true);
    try {
      const response = await getProducts(1, 20, query, 'name', 'asc', selectedBranch, undefined, true);
      if (response.data) {
        const items = Array.isArray(response.data)
          ? response.data
          : (response.data as { data?: Product[] }).data || [];
        setProductResults(items);
      }
    } catch (err) {
      console.error('Failed to search products:', err);
    } finally {
      setIsSearching(false);
    }
  }, [selectedBranch, activeShift]);

  useEffect(() => {
    if (!selectedBranch || !activeShift) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchProducts(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, selectedBranch, activeShift, searchProducts]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = cartSubtotal - discountAmount;
  const changeAmount = paidAmount - totalAmount;
  const outstandingAmount = Math.max(totalAmount - paidAmount, 0);

  const getStockForBranch = (product: Product): number => {
    if (selectedBranch && Array.isArray(product.stocks) && product.stocks.length > 0) {
      const stock = product.stocks.find(s => s.branch_uuid === selectedBranch);
      return stock ? Number(stock.stock) : 0;
    }
    if (typeof product.total_stock === 'number') {
      return product.total_stock;
    }
    if (typeof product.total_stock === 'string') {
      const parsed = Number(product.total_stock);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const addToCart = (product: Product) => {
    const stock = getStockForBranch(product);
    const existingItem = cart.find(item => item.product_uuid === product.uuid);
    if (existingItem) {
      if (existingItem.quantity >= stock) {
        setError(`Stok ${product.name} tidak cukup (tersedia: ${stock})`);
        return;
      }
      setCart(prev =>
        prev.map(item =>
          item.product_uuid === product.uuid
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price - item.discount }
            : item
        )
      );
    } else {
      if (stock <= 0) {
        setError(`Stok ${product.name} habis`);
        return;
      }
      const price = Number(product.selling_price);
      setCart(prev => [
        ...prev,
        { id: nextCartId, product_uuid: product.uuid, product_name: product.name, product_sku: product.sku, product_image: product.image || null, product_images: product.images || [], unit_price: price, quantity: 1, discount: 0, subtotal: price, available_stock: stock },
      ]);
      setNextCartId(prev => prev + 1);
    }
    setError('');
  };

  const updateQuantity = (id: number, newQty: number) => {
    if (newQty < 1) return;
    setCart(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        if (newQty > item.available_stock) {
          setError(`Stok tidak cukup (tersedia: ${item.available_stock})`);
          return item;
        }
        setError('');
        return { ...item, quantity: newQty, subtotal: newQty * item.unit_price - item.discount };
      })
    );
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setNotes('');
    setSelectedCustomer(null);
    setError('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const canProcess = Boolean(activeShift) && cart.length > 0 && selectedBranch && selectedPaymentMethod && totalAmount > 0;

  const selectedOpenShiftBranch = branches.find((branch) => branch.uuid === openShiftForm.branch_uuid);
  const isSelectedBranchFull = Boolean(
    selectedOpenShiftBranch &&
    typeof selectedOpenShiftBranch.max_concurrent_users === 'number' &&
    (selectedOpenShiftBranch.open_shift_count || 0) >= selectedOpenShiftBranch.max_concurrent_users
  );

  const handleOpenShift = async () => {
    if (!openShiftForm.branch_uuid) {
      setError('Pilih cabang untuk membuka shift');
      return;
    }

    setIsSubmittingShift(true);
    setError('');
    try {
      const response = await fetch('/api/app/pos/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_uuid: openShiftForm.branch_uuid,
          notes_open: openShiftForm.notes_open || null,
        }),
      });

      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Gagal membuka shift');
      }

      setOpenShiftForm((prev) => ({ ...prev, notes_open: '' }));
      setRecentlyClosedShift(null);
      await loadShiftState();
      setProductSearch('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal membuka shift';
      setError(message);
    } finally {
      setIsSubmittingShift(false);
    }
  };

  const handleProcess = async () => {
    if (!canProcess) return;
    setIsProcessing(true);
    setError('');
    try {
      const items: SaleItemCreateData[] = cart.map(item => ({
        product_uuid: item.product_uuid,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount > 0 ? item.discount : undefined,
      }));
      const response = await createSale({
        branch_uuid: selectedBranch,
        customer_uuid: selectedCustomer?.uuid,
        payment_method_uuid: selectedPaymentMethod,
        sale_date: new Date().toISOString().split('T')[0],
        discount_amount: discountAmount > 0 ? discountAmount : undefined,
        paid_amount: paidAmount,
        notes: notes || undefined,
        items,
      });
      if (response.status === 'success' && response.data) {
        setLastSale(response.data);
        setShowReceipt(true);
      } else {
        const message = (response as { message?: string }).message;
        setError(message || 'Gagal memproses transaksi');
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setShowReceipt(false);
    setLastSale(null);
    clearCart();
    setSelectedPaymentMethod('');
    searchProducts(productSearch);
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    if (cart.length > 0) {
      setError('Kosongkan atau selesaikan keranjang sebelum menutup shift.');
      return;
    }

    setIsSubmittingCloseShift(true);
    setError('');
    try {
      const response = await fetch(`/api/app/pos/shifts/${activeShift.uuid}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes_close: closeShiftForm.notes_close || null,
        }),
      });

      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Gagal menutup shift');
      }

      if (result.data) {
        setRecentlyClosedShift({
          uuid: result.data.uuid,
          closed_at: result.data.closed_at || null,
          total_sales: Number(result.data.total_sales || 0),
          branch: result.data.branch || null,
        });
      }

      clearCart();
      setProductSearch('');
      setProductResults([]);
      setShowCloseShiftModal(false);
      await loadShiftState();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menutup shift';
      setError(message);
    } finally {
      setIsSubmittingCloseShift(false);
    }
  };

  const handleBarcodeScan = useCallback(async (code: string) => {
    if (!selectedBranch || !activeShift || !code.trim()) return;
    try {
      const response = await lookupBarcode(code.trim(), selectedBranch || undefined);
      if (response.status === 'success' && response.data) {
        addToCart(response.data);
        setScanNotification({ type: 'success', message: `${response.data.name} ditambahkan` });
      } else {
        setScanNotification({ type: 'error', message: `Produk dengan barcode "${code}" tidak ditemukan` });
      }
    } catch {
      setScanNotification({ type: 'error', message: `Produk dengan barcode "${code}" tidak ditemukan` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, activeShift, cart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (showCameraScanner) return;
      if (e.key === 'Enter') {
        const code = barcodeBufferRef.current;
        barcodeBufferRef.current = '';
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        if (code.length >= 3) { e.preventDefault(); handleBarcodeScan(code); }
        return;
      }
      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => { barcodeBufferRef.current = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeScan, showCameraScanner]);

  useEffect(() => {
    if (scanNotification) {
      const timer = setTimeout(() => setScanNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanNotification]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col -m-6">
      {/* Header */}
      <div className="bg-white px-5 py-2.5 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-[#142D52] rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-[#EBC170]" />
          </div>
          <h1 className="text-base font-bold text-[#142D52]">Kasir</h1>
          {activeShift && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
              Shift aktif
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeShift && (
            <button
              type="button"
              onClick={() => setShowCloseShiftModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Tutup Shift
            </button>
          )}
          <select
            value={selectedBranch}
            onChange={(e) => { setSelectedBranch(e.target.value); setCart([]); }}
            disabled
            className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <option value="">{activeShift ? 'Cabang Shift Aktif' : 'Pilih Cabang Shift'}</option>
            {branches.map(branch => (
              <option key={branch.uuid} value={branch.uuid}>{branch.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="ml-2 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Main content */}
      {isShiftLoading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-sm text-gray-500">Memuat status shift kasir...</div>
        </div>
      ) : !activeShift && recentlyClosedShift ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-green-700">Shift Berhasil Ditutup</h2>
              <p className="text-sm text-gray-600 mt-1">
                Shift {recentlyClosedShift.branch?.name ? `di ${recentlyClosedShift.branch.name}` : ''} sudah ditutup.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                <p className="text-xs text-gray-500">Total Penjualan</p>
                <p className="text-sm font-semibold text-[#142D52]">{formatCurrency(recentlyClosedShift.total_sales)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Cocokkan kas laci dengan saldo akun Cash di menu Saldo.</p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setRecentlyClosedShift(null)}
                className="w-full px-4 py-2 rounded-lg bg-[#EBC170] hover:bg-[#d4ab5f] text-gray-900 font-semibold cursor-pointer"
              >
                Buka Shift Baru
              </button>
              <Link
                href="/app/pos/shifts"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-center font-medium"
              >
                Lihat Riwayat Shift
              </Link>
            </div>
          </div>
        </div>
      ) : !activeShift ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#142D52]">Buka Shift Dulu</h2>
              <p className="text-sm text-gray-600 mt-1">
                POS terkunci sampai shift kasir dibuka. Setelah shift aktif, transaksi bisa diproses.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
                <select
                  value={openShiftForm.branch_uuid}
                  onChange={(e) => setOpenShiftForm((prev) => ({ ...prev, branch_uuid: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((branch) => (
                    <option key={branch.uuid} value={branch.uuid}>
                      {branch.code ? `${branch.code} - ` : ''}{branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {isSelectedBranchFull && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Cabang ini sudah mencapai batas maksimal kasir aktif ({selectedOpenShiftBranch?.max_concurrent_users}). Tunggu salah satu kasir menutup shift-nya dulu.
                </div>
              )}

              {openShiftForm.branch_uuid && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">Saldo Cabang Ini</p>
                  {openShiftSaldo.isLoading ? (
                    <p className="text-xs text-gray-400">Memuat saldo...</p>
                  ) : openShiftSaldo.error ? (
                    <p className="text-xs text-red-500">{openShiftSaldo.error}</p>
                  ) : openShiftSaldo.items.length === 0 ? (
                    <p className="text-xs text-gray-400">Belum ada akun saldo untuk cabang ini</p>
                  ) : (
                    <div className="space-y-1.5">
                      {openShiftSaldo.items.map((item) => (
                        <div key={`${item.account.uuid}-${item.group.uuid}`} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {item.account.name}
                            {item.group.name ? <span className="text-gray-400"> ({item.group.name})</span> : ''}
                          </span>
                          <span className="font-medium text-[#142D52]">{formatCurrency(item.group.balance)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-200">
                        <span className="font-semibold text-gray-700">Total</span>
                        <span className="font-bold text-[#142D52]">{formatCurrency(openShiftSaldo.totalBalance)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={openShiftForm.notes_open}
                  onChange={(e) => setOpenShiftForm((prev) => ({ ...prev, notes_open: e.target.value }))}
                  placeholder="Catatan buka shift"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenShift}
              disabled={isSubmittingShift || isSelectedBranchFull}
              className="w-full px-4 py-2 rounded-lg bg-[#EBC170] hover:bg-[#d4ab5f] text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmittingShift ? 'Membuka Shift...' : 'Buka Shift'}
            </button>
          </div>
        </div>
      ) : (
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products + Cart (scrollable together) */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
          {/* Search */}
          <div className="px-4 py-2.5 border-b border-gray-200 bg-white relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={selectedBranch ? 'Cari produk (nama, kode produk, barcode)...' : 'Pilih cabang terlebih dahulu...'}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  disabled={!selectedBranch}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                disabled={!selectedBranch}
                className="px-3 py-2 bg-[#142D52] text-white rounded-lg hover:bg-[#1a3a6a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Scan barcode dengan kamera"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {selectedBranch && (productSearch.trim().length > 0 || isSearching) && (
              <div className="absolute left-4 right-4 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="p-3 text-xs text-gray-500">Mencari produk...</div>
                ) : productResults.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {productResults.map(product => {
                      const stock = getStockForBranch(product);
                      return (
                        <button
                          key={product.uuid}
                          type="button"
                          onClick={() => {
                            addToCart(product);
                            setProductSearch('');
                          }}
                          disabled={stock <= 0}
                          className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                            stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.image ? (
                              <Image
                                src={`${process.env.NEXT_PUBLIC_APP_URL}${product.image}`}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-[#142D52]">{formatCurrency(Number(product.selling_price))}</p>
                            <p className={`text-[10px] ${stock <= (product.min_stock || 0) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              Stok: {stock}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-gray-500">Produk tidak ditemukan</div>
                )}
              </div>
            )}
          </div>

          {/* Cart (full height under search) */}
          <div className="flex-1 border-t border-gray-200 bg-white flex flex-col shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-[#142D52]" />
                <span className="text-sm font-semibold text-[#142D52]">
                  Keranjang
                  <span className="ml-1 text-[#EBC170] bg-[#142D52] px-1.5 py-0.5 rounded-full text-[10px]">{cart.length}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-red-500 hover:text-red-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={cart.length === 0}
              >
                Kosongkan
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="text-left py-2 px-4 font-medium">Produk</th>
                    <th className="text-center py-2 px-2 font-medium w-28">Qty</th>
                    <th className="text-right py-2 px-4 font-medium w-32">Subtotal</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                        Keranjang masih kosong
                      </td>
                    </tr>
                  ) : (
                    cart.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ${item.product_images.length > 0 || item.product_image ? 'cursor-pointer hover:ring-2 hover:ring-[#EBC170] transition-all' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const urls = item.product_images.length > 0
                                  ? item.product_images.map(img => `${process.env.NEXT_PUBLIC_APP_URL}${img.url}`)
                                  : item.product_image ? [`${process.env.NEXT_PUBLIC_APP_URL}${item.product_image}`] : [];
                                if (urls.length > 0) {
                                  setImageGallery({ images: urls, name: item.product_name, index: 0 });
                                }
                              }}
                            >
                              {item.product_image ? (
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_APP_URL}${item.product_image}`}
                                  alt={item.product_name}
                                  width={36}
                                  height={36}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                              <p className="text-xs text-gray-400">{formatCurrency(item.unit_price)} / pcs</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center justify-center bg-gray-100 rounded-lg mx-auto w-fit">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-gray-200 rounded-l-lg transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-10 text-center text-sm font-medium bg-transparent border-0 focus:outline-none"
                              min="1"
                              max={item.available_stock}
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-gray-200 rounded-r-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <p className="text-sm font-semibold text-[#142D52]">{formatCurrency(item.subtotal)}</p>
                        </td>
                        <td className="py-2 pr-3">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Payment panel */}
        <div className="w-[340px] flex flex-col bg-white">
          {/* Payment header */}
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-[#142D52]">Pembayaran</h2>
          </div>

          {/* Payment section */}
          <div className="flex-1 overflow-y-auto">
            {/* Customer & Payment method */}
            <div className="px-4 py-3 space-y-3 border-b border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pelanggan</label>
                <CustomerSelect selectedCustomer={selectedCustomer} onSelect={setSelectedCustomer} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Metode Pembayaran</label>
                <div className="flex flex-wrap gap-1.5">
                  {paymentMethods.map(pm => (
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
            </div>

            {/* Summary */}
            <div className="px-4 py-3 space-y-2 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700 font-medium">{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Diskon</span>
                <input
                  type="number"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-28 text-right px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170]"
                  min="0"
                />
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                <span className="text-sm font-bold text-[#142D52]">Total</span>
                <span className="text-xl font-bold text-[#142D52]">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Bayar */}
            <div className="px-4 py-3 space-y-2 border-b border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bayar</label>
                <input
                  type="number"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-lg font-bold text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170]"
                  min="0"
                />
              </div>
              {totalAmount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setPaidAmount(totalAmount)} className="px-3 py-1.5 text-xs bg-[#EBC170]/10 border border-[#EBC170]/30 text-[#142D52] hover:bg-[#EBC170]/20 rounded-lg transition-colors cursor-pointer font-medium">
                    Uang Pas
                  </button>
                  {[20000, 50000, 100000, 200000].map(amount => (
                    amount >= totalAmount && (
                      <button key={amount} type="button" onClick={() => setPaidAmount(amount)} className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-600">
                        {formatCurrency(amount)}
                      </button>
                    )
                  ))}
                </div>
              )}
              {totalAmount > 0 && (
                <div className={`flex justify-between text-sm p-2.5 rounded-lg font-medium ${changeAmount >= 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  <span>{changeAmount >= 0 ? 'Kembalian' : 'Sisa Piutang'}</span>
                  <span className="font-bold">{formatCurrency(changeAmount >= 0 ? changeAmount : outstandingAmount)}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="px-4 py-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Catatan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan transaksi (opsional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] resize-none"
              />
            </div>
          </div>

          {/* Process button (sticky bottom) */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleProcess}
              disabled={!canProcess || isProcessing}
              className="w-full py-3 bg-[#142D52] text-white rounded-lg font-bold text-sm hover:bg-[#1a3a6a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Memproses...' : `Proses Transaksi${cart.length > 0 ? ` (${cart.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
      )}

      {showCloseShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-[#142D52]">Tutup Shift</h3>
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="p-1 rounded hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
                <p className="text-gray-600">Cabang Shift</p>
                <p className="font-semibold text-[#142D52]">{activeShift.branch?.name || '-'}</p>
                <p className="text-gray-600 mt-2">Total Penjualan Berjalan</p>
                <p className="font-semibold text-[#142D52]">{formatCurrency(activeShift.current_total_sales || 0)}</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Saldo Cabang Ini</p>
                {closeShiftSaldo.isLoading ? (
                  <p className="text-xs text-gray-400">Memuat saldo...</p>
                ) : closeShiftSaldo.error ? (
                  <p className="text-xs text-red-500">{closeShiftSaldo.error}</p>
                ) : closeShiftSaldo.items.length === 0 ? (
                  <p className="text-xs text-gray-400">Belum ada akun saldo untuk cabang ini</p>
                ) : (
                  <div className="space-y-1.5">
                    {closeShiftSaldo.items.map((item) => (
                      <div key={`${item.account.uuid}-${item.group.uuid}`} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {item.account.name}
                          {item.group.name ? <span className="text-gray-400"> ({item.group.name})</span> : ''}
                        </span>
                        <span className="font-medium text-[#142D52]">{formatCurrency(item.group.balance)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-200">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="font-bold text-[#142D52]">{formatCurrency(closeShiftSaldo.totalBalance)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tutup Shift</label>
                <textarea
                  rows={3}
                  value={closeShiftForm.notes_close}
                  onChange={(e) => setCloseShiftForm((prev) => ({ ...prev, notes_close: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] resize-none"
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                disabled={isSubmittingCloseShift}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmittingCloseShift ? 'Menutup...' : 'Tutup Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan notification toast */}
      {scanNotification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all ${
          scanNotification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {scanNotification.message}
        </div>
      )}

      <BarcodeScanner
        isOpen={showCameraScanner}
        onScan={(code) => { setShowCameraScanner(false); handleBarcodeScan(code); }}
        onClose={() => setShowCameraScanner(false)}
      />

      <ReceiptModal
        isOpen={showReceipt}
        sale={lastSale}
        onClose={() => setShowReceipt(false)}
        onNewTransaction={handleNewTransaction}
      />

      {/* Fullscreen image gallery lightbox */}
      {imageGallery && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setImageGallery(null)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
            <div className="text-white">
              <p className="text-sm font-medium">{imageGallery.name}</p>
              {imageGallery.images.length > 1 && (
                <p className="text-xs text-white/60">{imageGallery.index + 1} / {imageGallery.images.length}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setImageGallery(null)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Main image area */}
          <div className="flex-1 flex items-center justify-center relative min-h-0 px-16" onClick={(e) => e.stopPropagation()}>
            {/* Prev button */}
            {imageGallery.images.length > 1 && (
              <button
                type="button"
                onClick={() => setImageGallery(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null)}
                className="absolute left-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}

            {/* Image */}
            <div className="relative w-full h-full max-w-2xl mx-auto">
              <Image
                src={imageGallery.images[imageGallery.index]}
                alt={imageGallery.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Next button */}
            {imageGallery.images.length > 1 && (
              <button
                type="button"
                onClick={() => setImageGallery(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null)}
                className="absolute right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer z-10"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {imageGallery.images.length > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {imageGallery.images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageGallery(prev => prev ? { ...prev, index: i } : null)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                    i === imageGallery.index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
