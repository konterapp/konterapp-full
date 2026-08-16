'use client';

import { useState, useEffect, useMemo } from 'react';
import { Zap, Wallet, RefreshCw } from 'lucide-react';
import { getAllBranches, Branch } from '@/lib/api/app/branch';
import { getAllPaymentMethods, PaymentMethod } from '@/lib/api/app/payment-method';
import { PpobProductLocal, PpobTransaction, getPpobProductsByCategory, getPpobBrandsByCategory, getProviderBalance } from '@/lib/api/app/ppob';
import { detectBrandFromPhone } from '@/lib/utils/phone';
import CategoryTabs from './_components/CategoryTabs';
import ProductGrid from './_components/ProductGrid';
import TransactionPanel from './_components/TransactionPanel';

const PPOB_GROUPS = [
  { code: 'PULSA', label: 'Pulsa', type: 'prepaid' as const },
  { code: 'DATA', label: 'Data', type: 'prepaid' as const },
  { code: 'PLNPRA', label: 'PLN Prabayar', type: 'prepaid' as const },
  { code: 'PLNPASCA', label: 'PLN Pascabayar', type: 'postpaid' as const },
  { code: 'TELKOM', label: 'Telkom', type: 'postpaid' as const },
  { code: 'PDAM', label: 'PDAM', type: 'postpaid' as const },
  { code: 'BPJS', label: 'BPJS', type: 'postpaid' as const },
  { code: 'EMONEY', label: 'E-Money', type: 'prepaid' as const },
  { code: 'GAME', label: 'Voucher Game', type: 'prepaid' as const },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
}

export default function PpobPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [products, setProducts] = useState<PpobProductLocal[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [activeType, setActiveType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [activeGroup, setActiveGroup] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<PpobProductLocal | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [activeBrand, setActiveBrand] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

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
            : (branchesRes.data as { data?: Branch[] })?.data || [];
          setBranches(branchItems);
          const mainBranch = branchItems.find(b => b.is_main);
          if (mainBranch) setSelectedBranch(mainBranch.uuid);
          else if (branchItems.length === 1) setSelectedBranch(branchItems[0].uuid);
        }
        if (paymentMethodsRes.data) {
          const paymentItems = Array.isArray(paymentMethodsRes.data)
            ? paymentMethodsRes.data
            : (paymentMethodsRes.data as { data?: PaymentMethod[] })?.data || [];
          setPaymentMethods(paymentItems);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  // Load brands when group changes
  useEffect(() => {
    if (!activeGroup) {
      setBrands([]);
      setActiveBrand('');
      return;
    }

    const loadBrands = async () => {
      try {
        const result = await getPpobBrandsByCategory(activeGroup);
        if (result.data) {
          setBrands(result.data);
        } else {
          setBrands([]);
        }
      } catch {
        setBrands([]);
      }
    };
    loadBrands();
  }, [activeGroup]);

  // Load products from local DB when group or brand changes
  useEffect(() => {
    if (!activeGroup) {
      setProducts([]);
      return;
    }

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const result = await getPpobProductsByCategory(activeGroup, activeBrand || undefined);
        if (result.data) {
          setProducts(result.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, [activeGroup, activeBrand]);

  const handleCheckBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const result = await getProviderBalance('rajabiller');
      if (result.STATUS === '00' && result.SALDO !== undefined) {
        setBalance(String(result.SALDO));
      }
    } catch (err) {
      console.error('Failed to check balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const filteredGroups = useMemo(() => {
    return PPOB_GROUPS.filter(g => g.type === activeType);
  }, [activeType]);

  const handleTypeChange = (type: 'prepaid' | 'postpaid') => {
    setActiveType(type);
    setActiveGroup('');
    setActiveBrand('');
    setSelectedProduct(null);
    setProductSearch('');
    setProducts([]);
  };

  const handleGroupChange = (groupCode: string) => {
    setActiveGroup(groupCode);
    setActiveBrand('');
    setSelectedProduct(null);
    setProductSearch('');
  };

  const handleCustomerNumberChange = (number: string) => {
    if ((activeGroup === 'PULSA' || activeGroup === 'DATA') && brands.length > 0) {
      const detected = detectBrandFromPhone(number);
      if (detected && brands.includes(detected)) {
        setActiveBrand(detected);
      } else if (!number || number.replace(/\D/g, '').length < 4) {
        setActiveBrand('');
      }
    }
  };

  const handleTransactionComplete = (transaction: PpobTransaction) => {
    console.log('Transaction complete:', transaction.transaction_number);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#EBC170]" />
          <h1 className="text-lg font-bold text-[#142D52]">PPOB</h1>
        </div>
        <div className="flex items-center gap-3">
          {balance !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              <Wallet className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Saldo:</span>
              <span className="font-semibold text-[#142D52]">{formatPrice(Number(balance))}</span>
            </div>
          )}
          <button
            onClick={handleCheckBalance}
            disabled={isLoadingBalance}
            className="p-2 text-gray-400 hover:text-[#142D52] rounded-lg hover:bg-gray-100 transition-colors"
            title="Cek Saldo Provider"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden bg-gray-50">
          {/* Type toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleTypeChange('prepaid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeType === 'prepaid'
                  ? 'bg-[#EBC170] text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Prabayar
            </button>
            <button
              onClick={() => handleTypeChange('postpaid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeType === 'postpaid'
                  ? 'bg-[#EBC170] text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pascabayar
            </button>
          </div>

          {/* Group tabs */}
          <CategoryTabs
            categories={filteredGroups.map(g => g.code)}
            categoryLabels={Object.fromEntries(filteredGroups.map(g => [g.code, g.label]))}
            activeCategory={activeGroup}
            onSelect={handleGroupChange}
          />

          {/* Brand filter */}
          {brands.length > 0 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              <span className="text-xs text-gray-400 shrink-0">Brand:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveBrand('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    !activeBrand
                      ? 'bg-[#142D52] text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Semua
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setActiveBrand(brand)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeBrand === brand
                        ? 'bg-[#142D52] text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 mt-3 overflow-hidden">
            <ProductGrid
              products={products}
              selectedProduct={selectedProduct}
              onSelect={setSelectedProduct}
              searchQuery={productSearch}
              onSearchChange={setProductSearch}
              isLoading={isLoadingProducts}
            />
          </div>
        </div>

        {/* Right: Transaction Panel */}
        <div className="w-[380px] border-l bg-white flex flex-col overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-[#142D52]">Transaksi</h2>
          </div>
          <div className="flex-1 p-4">
            <TransactionPanel
              selectedProduct={selectedProduct}
              activeGroup={activeGroup}
              activeType={activeType}
              branches={branches}
              paymentMethods={paymentMethods}
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              onCustomerNumberChange={handleCustomerNumberChange}
              onTransactionComplete={handleTransactionComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
