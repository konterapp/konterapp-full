'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ShoppingCart, Search, Plus, Minus, Trash2, Package, Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllBranches, Branch } from '@/lib/api/admin/branch';
import { getProducts, Product, ProductImageData, lookupBarcode } from '@/lib/api/admin/product';
import { getAllPaymentMethods, PaymentMethod } from '@/lib/api/admin/payment-method';
import { Customer } from '@/lib/api/admin/customer';
import { createSale, Sale, SaleItemCreateData } from '@/lib/api/admin/sale';
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

export default function KasirPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
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


  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchesRes, paymentMethodsRes] = await Promise.all([
          getAllBranches(),
          getAllPaymentMethods(),
        ]);
        if (branchesRes.data) {
          const branchItems = Array.isArray(branchesRes.data)
            ? branchesRes.data
            : (branchesRes.data as { data?: Branch[] }).data || [];
          setBranches(branchItems);
          const mainBranch = branchItems.find(b => b.is_main);
          if (mainBranch) setSelectedBranch(mainBranch.uuid);
          else if (branchItems.length === 1) setSelectedBranch(branchItems[0].uuid);
        }
        if (paymentMethodsRes.data) {
          const paymentItems = Array.isArray(paymentMethodsRes.data)
            ? paymentMethodsRes.data
            : (paymentMethodsRes.data as { data?: PaymentMethod[] }).data || [];
          setPaymentMethods(paymentItems);
          const cashMethod = paymentItems.find(pm => pm.type === 'cash');
          if (cashMethod) setSelectedPaymentMethod(cashMethod.uuid);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    if (!selectedBranch) return;
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
  }, [selectedBranch]);

  useEffect(() => {
    if (!selectedBranch) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchProducts(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, selectedBranch, searchProducts]);

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

  const canProcess = cart.length > 0 && selectedBranch && selectedPaymentMethod && totalAmount > 0;

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

  const handleBarcodeScan = useCallback(async (code: string) => {
    if (!selectedBranch || !code.trim()) return;
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
  }, [selectedBranch, cart]);

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
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedBranch}
            onChange={(e) => { setSelectedBranch(e.target.value); setCart([]); }}
            className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170]"
          >
            <option value="">Pilih Cabang</option>
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
                                src={`${process.env.NEXT_PUBLIC_API_URL}${product.image}`}
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
                                  ? item.product_images.map(img => `${process.env.NEXT_PUBLIC_API_URL}${img.url}`)
                                  : item.product_image ? [`${process.env.NEXT_PUBLIC_API_URL}${item.product_image}`] : [];
                                if (urls.length > 0) {
                                  setImageGallery({ images: urls, name: item.product_name, index: 0 });
                                }
                              }}
                            >
                              {item.product_image ? (
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_URL}${item.product_image}`}
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
