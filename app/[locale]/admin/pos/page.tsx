'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ShoppingCart, Search, Plus, Minus, Trash2, Package, Camera, X } from 'lucide-react';
import CustomerSelect from './_components/CustomerSelect';
import ReceiptModal from './_components/ReceiptModal';

interface Branch {
  uuid: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_main: boolean;
}

interface Product {
  uuid: string;
  name: string;
  sku: string;
  selling_price: number;
  image?: string | null;
  stocks?: { branch_uuid: string; stock: number }[];
}

interface PaymentMethod {
  uuid: string;
  code: string;
  name: string;
  type: string;
}

interface CartItem {
  id: number;
  product_uuid: string;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  discount: number;
  subtotal: number;
  available_stock: number;
}

interface Customer {
  uuid: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Sale {
  uuid: string;
  saleNumber: string;
  customer?: Customer;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  createdAt: string;
  creator?: { name: string };
  paymentMethod?: { name: string };
  items: Array<{
    product: { name: string };
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }>;
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
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Partial<Sale> | null>(null);
  const [imageGallery, setImageGallery] = useState<{ images: string[]; name: string; index: number } | null>(null);

  // Load branches and payment methods
  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchesRes, paymentMethodsRes] = await Promise.all([
          fetch('/api/admin/pos/branches').then(r => r.json()),
          fetch('/api/admin/pos/payment-methods').then(r => r.json()),
        ]);
        
        if (branchesRes.status === 'success' && branchesRes.data) {
          setBranches(branchesRes.data.data || branchesRes.data);
          const mainBranch = (branchesRes.data.data || branchesRes.data).find((b: Branch) => b.is_main);
          if (mainBranch) setSelectedBranch(mainBranch.uuid);
          else if (Array.isArray(branchesRes.data.data || branchesRes.data) && branchesRes.data.length === 1) {
            setSelectedBranch(branchesRes.data[0].uuid);
          }
        }
        
        if (paymentMethodsRes.status === 'success' && paymentMethodsRes.data) {
          setPaymentMethods(paymentMethodsRes.data.data || paymentMethodsRes.data);
          const cashMethod = (paymentMethodsRes.data.data || paymentMethodsRes.data).find((pm: PaymentMethod) => pm.type === 'cash');
          if (cashMethod) setSelectedPaymentMethod(cashMethod.uuid);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (!selectedBranch) return;
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        per_page: '20',
        search: query,
        branch_uuid: selectedBranch,
      });
      
      const response = await fetch(`/api/admin/pos/products?${params}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setProductResults(data.data.data || data.data);
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

  const getStockForBranch = (product: Product): number => {
    if (!product.stocks || !selectedBranch) return 0;
    const stock = product.stocks.find(s => s.branch_uuid === selectedBranch);
    return stock ? stock.stock : 0;
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
        {
          id: nextCartId,
          product_uuid: product.uuid,
          product_name: product.name,
          product_sku: product.sku,
          product_image: product.image || null,
          unit_price: price,
          quantity: 1,
          discount: 0,
          subtotal: price,
          available_stock: stock,
        },
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

  const updateItemDiscount = (id: number, discount: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, discount, subtotal: item.quantity * item.unit_price - discount }
          : item
      )
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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const canProcess = cart.length > 0 && selectedBranch && selectedPaymentMethod && paidAmount >= totalAmount && totalAmount > 0;

  const handleProcess = async () => {
    if (!canProcess) return;
    setIsProcessing(true);
    setError('');
    
    try {
      const items = cart.map(item => ({
        product_uuid: item.product_uuid,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount > 0 ? item.discount : undefined,
      }));

      const response = await fetch('/api/admin/pos/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_uuid: selectedBranch,
          customer_uuid: selectedCustomer?.uuid,
          payment_method_uuid: selectedPaymentMethod,
          sale_date: new Date().toISOString().split('T')[0],
          items,
          discount_amount: discountAmount > 0 ? discountAmount : undefined,
          paid_amount: paidAmount,
          notes: notes || undefined,
        }),
      });

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setLastSale(result.data);
        setShowReceipt(true);
      } else {
        setError(result.message || 'Gagal memproses transaksi');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setShowReceipt(false);
    setLastSale(null);
    clearCart();
    setPaidAmount(0);
    setDiscountAmount(0);
    setNotes('');
    searchProducts(productSearch);
  };

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
        <select
          value={selectedBranch}
          onChange={(e) => { setSelectedBranch(e.target.value); setCart([]); }}
          className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
        >
          <option value="">Pilih Cabang</option>
          {branches.map(branch => (
            <option key={branch.uuid} value={branch.uuid}>{branch.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mx-4 mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="ml-2 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products + Cart */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
          {/* Search */}
          <div className="px-4 py-2.5 border-b border-gray-200 bg-white">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={selectedBranch ? 'Cari produk (nama, SKU, barcode)...' : 'Pilih cabang terlebih dahulu...'}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  disabled={!selectedBranch}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
            {!selectedBranch ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Package className="w-12 h-12 mb-2" />
                <p className="text-sm font-medium">Pilih cabang terlebih dahulu</p>
              </div>
            ) : isSearching ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                    <div className="h-24 bg-gray-200" />
                    <div className="p-2 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productResults.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {productResults.map(product => {
                  const stock = getStockForBranch(product);
                  const inCart = cart.find(item => item.product_uuid === product.uuid);
                  return (
                    <button
                      key={product.uuid}
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={stock <= 0}
                      className={`bg-white border rounded-lg overflow-hidden text-left transition-all hover:shadow-md cursor-pointer ${
                        stock <= 0 ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-gray-200 hover:border-[#EBC170]'
                      } ${inCart ? 'ring-2 ring-[#EBC170]' : ''}`}
                    >
                      <div className="relative w-full h-24 bg-gray-100">
                        {product.image ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL || ''}${product.image}`}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        {inCart && (
                          <span className="absolute top-1 right-1 bg-[#EBC170] text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs font-bold text-[#142D52] mt-0.5">{formatCurrency(Number(product.selling_price))}</p>
                        <p className={`text-[10px] mt-0.5 ${stock <= 0 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          Stok: {stock}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Search className="w-10 h-10 mb-2" />
                <p className="text-sm">Ketik untuk mencari produk</p>
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 bg-white flex flex-col max-h-[45%] shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-[#142D52]" />
                  <span className="text-sm font-semibold text-[#142D52]">
                    Keranjang
                    <span className="ml-1 text-[#EBC170] bg-[#142D52] px-1.5 py-0.5 rounded-full text-[10px]">{cart.length}</span>
                  </span>
                </div>
                <button type="button" onClick={clearCart} className="text-[11px] text-red-500 hover:text-red-700 font-medium cursor-pointer">
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
                    {cart.map(item => (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {item.product_image ? (
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_URL || ''}${item.product_image}`}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Payment panel */}
        <div className="w-[340px] flex flex-col bg-white">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-[#142D52]">Pembayaran</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
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
                          ? 'border-[#142D52] bg-[#142D52] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {pm.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Diskon</span>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-24 text-right text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#142D52]">Total</span>
                  <span className="text-xl font-bold text-[#142D52]">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Jumlah Bayar</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full text-lg font-bold text-right border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                  placeholder="0"
                  min="0"
                />
                {paidAmount > 0 && (
                  <div className={`text-sm ${changeAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Kembalian: {formatCurrency(changeAmount)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Catatan (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EBC170] resize-none"
                  rows={2}
                  placeholder="Catatan transaksi..."
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleProcess}
              disabled={!canProcess || isProcessing}
              className="w-full py-3 px-4 bg-[#142D52] text-white font-bold rounded-lg hover:bg-[#1a3a6a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Memproses...' : 'Proses Transaksi'}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <ReceiptModal
          isOpen={showReceipt}
          onClose={handleNewTransaction}
          sale={lastSale}
        />
      )}
    </div>
  );
}
