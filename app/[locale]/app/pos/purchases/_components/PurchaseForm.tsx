'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/toast/ToastContainer';

type PurchaseFormMode = 'create' | 'edit';

type BranchOption = {
  uuid: string;
  name: string;
  code?: string | null;
};

type SupplierOption = {
  uuid: string;
  name: string;
  code?: string | null;
  phone?: string | null;
};

type ProductOption = {
  uuid: string;
  name: string;
  sku: string;
  unit: string;
  purchase_price: number;
  purchase_units: Array<{
    unit: string;
    factor_to_base: number;
    is_base: boolean;
  }>;
};

type PurchaseRow = {
  key: string;
  product_uuid: string;
  unit: string;
  quantity: string;
  unit_price: string;
  discount: string;
};

type PurchaseItemDetail = {
  uuid: string;
  product_uuid: string;
  unit: string;
  factor_to_base: number;
  quantity_base: number;
  quantity: number;
  unit_price: number;
  discount: number;
  product?: {
    uuid: string;
    name: string;
    sku?: string | null;
    unit?: string | null;
  } | null;
};

type PurchaseDetail = {
  uuid: string;
  branch_uuid: string;
  supplier_uuid?: string | null;
  purchase_date: string;
  discount_amount: number;
  paid_amount: number;
  payment_status: string;
  notes?: string | null;
  items?: PurchaseItemDetail[];
};

function createRow(): PurchaseRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_uuid: '',
    unit: '',
    quantity: '1',
    unit_price: '0',
    discount: '0',
  };
}

export default function PurchaseForm({ mode, purchaseUuid }: { mode: PurchaseFormMode; purchaseUuid?: string }) {
  const router = useRouter();
  const toast = useToast();

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<'draft' | 'final'>('final');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [branchUuid, setBranchUuid] = useState('');
  const [supplierUuid, setSupplierUuid] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<PurchaseRow[]>([createRow()]);
  const [editPurchase, setEditPurchase] = useState<PurchaseDetail | null>(null);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductOption>();
    for (const product of products) {
      map.set(product.uuid, product);
    }
    return map;
  }, [products]);

  const selectedProducts = useMemo(() => new Set(rows.map((row) => row.product_uuid).filter(Boolean)), [rows]);

  const calculations = useMemo(() => {
    const subtotal = rows.reduce((sum, row) => {
      const qty = Number(row.quantity || 0);
      const unitPrice = Number(row.unit_price || 0);
      return sum + qty * unitPrice;
    }, 0);

    const itemDiscount = rows.reduce((sum, row) => sum + Number(row.discount || 0), 0);
    const globalDiscount = Number(discountAmount || 0);
    const totalDiscount = itemDiscount + globalDiscount;
    const totalAmount = Math.max(subtotal - totalDiscount, 0);
    const paid = Number(paidAmount || 0);
    const hasSupplier = Boolean(supplierUuid.trim());
    const effectivePaid = hasSupplier ? paid : totalAmount;
    const outstanding = Math.max(totalAmount - effectivePaid, 0);
    const paymentStatus = effectivePaid <= 0 ? 'pending' : effectivePaid < totalAmount ? 'partial' : 'paid';

    return {
      subtotal,
      itemDiscount,
      globalDiscount,
      totalDiscount,
      totalAmount,
      paid,
      effectivePaid,
      hasSupplier,
      outstanding,
      paymentStatus,
    };
  }, [rows, discountAmount, paidAmount, supplierUuid]);

  const isLockedEdit = mode === 'edit' && !!editPurchase && editPurchase.payment_status !== 'draft';

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const response = await fetch('/api/app/pos/purchases/options');
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          setBranches(result.data.branches || []);
          setSuppliers(result.data.suppliers || []);
          setProducts(result.data.products || []);
        } else {
          setError(result.message || 'Gagal memuat data referensi');
        }
      } catch {
        setError('Terjadi kesalahan saat memuat data referensi');
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !purchaseUuid) {
      setIsLoadingPurchase(false);
      return;
    }

    const fetchPurchase = async () => {
      try {
        setIsLoadingPurchase(true);
        const response = await fetch(`/api/app/pos/purchases/${purchaseUuid}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
          const purchase = result.data as PurchaseDetail;
          setEditPurchase(purchase);
          setBranchUuid(purchase.branch_uuid || '');
          setSupplierUuid(purchase.supplier_uuid || '');
          setPurchaseDate((purchase.purchase_date || '').split('T')[0] || new Date().toISOString().split('T')[0]);

          const purchaseItems = Array.isArray(purchase.items) ? purchase.items : [];
          const itemDiscountSum = purchaseItems.reduce((sum, item) => sum + Number(item.discount || 0), 0);
          const globalDiscount = Math.max(Number(purchase.discount_amount || 0) - itemDiscountSum, 0);

          setDiscountAmount(String(globalDiscount));
          setPaidAmount(String(Number(purchase.paid_amount || 0)));
          setNotes(purchase.notes || '');
          setRows(
            purchaseItems.length > 0
              ? purchaseItems.map((item) => ({
                  key: `row-${item.uuid}`,
                  product_uuid: item.product_uuid,
                  unit: item.unit || item.product?.unit || '',
                  quantity: String(Number(item.quantity || 0)),
                  unit_price: String(Number(item.unit_price || 0)),
                  discount: String(Number(item.discount || 0)),
                }))
              : [createRow()]
          );
        } else {
          setError(result.message || 'Data pembelian tidak ditemukan');
        }
      } catch {
        setError('Terjadi kesalahan saat memuat data pembelian');
      } finally {
        setIsLoadingPurchase(false);
      }
    };

    fetchPurchase();
  }, [mode, purchaseUuid]);

  useEffect(() => {
    if (!editPurchase || !Array.isArray(editPurchase.items)) return;

    setProducts((prev) => {
      const next = [...prev];

      for (const item of editPurchase.items || []) {
        const productUuid = item.product?.uuid || item.product_uuid;
        if (!productUuid) continue;

        const baseUnit = item.product?.unit || 'pcs';
        const extraUnit = item.unit;
        const extraFactor = Number(item.factor_to_base || 1);

        const index = next.findIndex((product) => product.uuid === productUuid);
        if (index === -1) {
          next.push({
            uuid: productUuid,
            name: item.product?.name || `Produk ${productUuid}`,
            sku: item.product?.sku || '-',
            unit: baseUnit,
            purchase_price: Number(item.unit_price || 0),
            purchase_units: [
              {
                unit: baseUnit,
                factor_to_base: 1,
                is_base: true,
              },
              ...(extraUnit && extraUnit !== baseUnit
                ? [
                    {
                      unit: extraUnit,
                      factor_to_base: extraFactor > 0 ? extraFactor : 1,
                      is_base: false,
                    },
                  ]
                : []),
            ],
          });
          continue;
        }

        const current = next[index];
        const hasExtraUnit = current.purchase_units.some((option) => option.unit === extraUnit);
        if (extraUnit && !hasExtraUnit) {
          next[index] = {
            ...current,
            purchase_units: [
              ...current.purchase_units,
              {
                unit: extraUnit,
                factor_to_base: extraFactor > 0 ? extraFactor : 1,
                is_base: false,
              },
            ],
          };
        }
      }

      return next;
    });
  }, [editPurchase]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const resolveSelectedUnitFactor = (product: ProductOption | undefined, selectedUnit: string) => {
    if (!product || !selectedUnit) return 1;
    const selected = product.purchase_units.find((option) => option.unit === selectedUnit);
    return Number(selected?.factor_to_base || 1);
  };

  const handleRowChange = (key: string, patch: Partial<PurchaseRow>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow()]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((row) => row.key !== key);
    });
  };

  const validateBeforeSubmit = () => {
    if (isLockedEdit) {
      toast.error('Hanya draft yang bisa diedit. Dokumen final gunakan void/retur.');
      return false;
    }

    if (!branchUuid) {
      toast.error('Cabang wajib dipilih');
      return false;
    }
    const validRows = rows.filter((row) => row.product_uuid);
    if (validRows.length === 0) {
      toast.error('Minimal isi 1 item pembelian');
      return false;
    }

    const seen = new Set<string>();
    for (const row of validRows) {
      if (seen.has(row.product_uuid)) {
        toast.error('Produk dalam satu dokumen pembelian tidak boleh duplikat');
        return false;
      }
      seen.add(row.product_uuid);

      if (!row.unit) {
        toast.error('Satuan item wajib dipilih');
        return false;
      }

      const qty = Number(row.quantity);
      const unitPrice = Number(row.unit_price);
      const discount = Number(row.discount || 0);
      const product = productMap.get(row.product_uuid);
      const selectedUnit = product?.purchase_units.find((option) => option.unit === row.unit);

      if (!Number.isInteger(qty) || qty <= 0) {
        toast.error('Qty item harus bilangan bulat dan lebih dari 0');
        return false;
      }
      if (!product || !selectedUnit) {
        toast.error('Satuan item tidak valid untuk produk yang dipilih');
        return false;
      }
      const quantityBaseRaw = qty * Number(selectedUnit.factor_to_base || 1);
      if (Math.abs(quantityBaseRaw - Math.round(quantityBaseRaw)) > 1e-9) {
        toast.error('Konversi qty menghasilkan stok pecahan, sesuaikan qty atau satuan');
        return false;
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        toast.error('Harga beli item tidak valid');
        return false;
      }
      if (!Number.isFinite(discount) || discount < 0 || discount > qty * unitPrice) {
        toast.error('Diskon item tidak valid');
        return false;
      }
    }

    if (!Number.isFinite(calculations.globalDiscount) || calculations.globalDiscount < 0) {
      toast.error('Diskon tidak boleh negatif');
      return false;
    }
    if (calculations.totalAmount <= 0) {
      toast.error('Total pembelian harus lebih dari 0');
      return false;
    }

    if (submitIntent === 'final') {
      if (!Number.isFinite(calculations.paid) || calculations.paid < 0 || calculations.paid > calculations.totalAmount) {
        toast.error('Nominal bayar tidak boleh negatif atau melebihi total');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateBeforeSubmit()) return;

    const isDraftAction = submitIntent === 'draft';

    const payload: Record<string, unknown> = {
      branch_uuid: branchUuid,
      supplier_uuid: supplierUuid || null,
      purchase_date: purchaseDate,
      discount_amount: calculations.globalDiscount,
      paid_amount: isDraftAction ? 0 : calculations.paid,
      notes: notes.trim(),
      items: rows
        .filter((row) => row.product_uuid)
        .map((row) => ({
          product_uuid: row.product_uuid,
          unit: row.unit,
          quantity: Number(row.quantity),
          unit_price: Number(row.unit_price),
          discount: Number(row.discount || 0),
        })),
    };

    let url = '/api/app/pos/purchases';
    let method: 'POST' | 'PUT' = 'POST';

    if (mode === 'create') {
      payload.is_draft = isDraftAction;
    } else {
      method = 'PUT';
      url = `/api/app/pos/purchases/${purchaseUuid}`;
      payload.finalize = !isDraftAction;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        if (mode === 'create' && isDraftAction) {
          toast.success('Draft pembelian berhasil disimpan');
        } else if (mode === 'create') {
          toast.success('Pembelian berhasil disimpan');
        } else if (isDraftAction) {
          toast.success('Draft pembelian berhasil diperbarui');
        } else {
          toast.success('Pembelian berhasil difinalisasi');
        }

        const targetUuid = result.data.uuid || purchaseUuid;
        router.push(`/app/pos/purchases/${targetUuid}`);
        return;
      }

      if (result.errors) setFieldErrors(result.errors);
      const message = result.message || (mode === 'create' ? 'Gagal menyimpan pembelian' : 'Gagal memperbarui draft pembelian');
      setError(message);
      toast.error(message);
    } catch {
      const message = mode === 'create' ? 'Terjadi kesalahan saat menyimpan pembelian' : 'Terjadi kesalahan saat memperbarui draft pembelian';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadgeClass =
    calculations.paymentStatus === 'paid'
      ? 'bg-green-100 text-green-800'
      : calculations.paymentStatus === 'partial'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-yellow-100 text-yellow-800';

  const statusLabel =
    calculations.paymentStatus === 'paid'
      ? 'Lunas'
      : calculations.paymentStatus === 'partial'
        ? 'Dibayar Sebagian'
        : 'Belum Dibayar';

  if (isLoadingOptions || (mode === 'edit' && isLoadingPurchase)) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex h-40 items-center justify-center text-sm text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-[#142D52]">{mode === 'create' ? 'Tambah Pembelian' : 'Edit Draft Pembelian'}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {mode === 'create'
          ? 'Catat stock in pembelian. Supplier opsional: jika tanpa supplier, dokumen final otomatis dianggap lunas.'
          : 'Hanya dokumen draft yang bisa diedit atau difinalisasi.'}
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isLockedEdit && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Dokumen ini sudah final ({editPurchase?.payment_status}) dan tidak bisa diedit. Gunakan void/retur untuk koreksi.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cabang</label>
            <select
              value={branchUuid}
              onChange={(e) => setBranchUuid(e.target.value)}
              disabled={isSubmitting || isLockedEdit}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Pilih Cabang</option>
              {branches.map((branch) => (
                <option key={branch.uuid} value={branch.uuid}>
                  {branch.name}
                </option>
              ))}
            </select>
            {fieldErrors.branch_uuid && <p className="mt-1 text-xs text-red-600">{fieldErrors.branch_uuid[0]}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Supplier (Opsional)</label>
            <select
              value={supplierUuid}
              onChange={(e) => setSupplierUuid(e.target.value)}
              disabled={isSubmitting || isLockedEdit}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              <option value="">Tanpa Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.uuid} value={supplier.uuid}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {!supplierUuid && (
              <p className="mt-1 text-xs text-gray-500">Pembelian final tanpa supplier tidak dicatat sebagai hutang.</p>
            )}
            {fieldErrors.supplier_uuid && <p className="mt-1 text-xs text-red-600">{fieldErrors.supplier_uuid[0]}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal Pembelian</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              disabled={isSubmitting || isLockedEdit}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            />
            {fieldErrors.purchase_date && <p className="mt-1 text-xs text-red-600">{fieldErrors.purchase_date[0]}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status Bayar (Final)</label>
            <div className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold ${statusBadgeClass}`}>{statusLabel}</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Item Pembelian</h2>
            <button
              type="button"
              onClick={addRow}
              disabled={isSubmitting || isLockedEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#EBC170] px-3 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Baris
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Produk</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Satuan</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Harga Beli</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Diskon</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Subtotal</th>
                  <th className="w-20 px-4 py-2 text-left text-xs font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const product = row.product_uuid ? productMap.get(row.product_uuid) : null;
                  const baseUnit = product?.unit || 'pcs';
                  const factorToBase = resolveSelectedUnitFactor(product, row.unit);
                  const quantityBase = Number(row.quantity || 0) * factorToBase;
                  const rowSubtotal = Math.max(
                    Number(row.quantity || 0) * Number(row.unit_price || 0) - Number(row.discount || 0),
                    0
                  );

                  return (
                    <tr key={row.key} className="border-b border-gray-100">
                      <td className="px-4 py-2">
                        <select
                          value={row.product_uuid}
                          onChange={(e) => {
                            const nextProductUuid = e.target.value;
                            const selected = productMap.get(nextProductUuid);
                            handleRowChange(row.key, {
                              product_uuid: nextProductUuid,
                              unit: selected?.unit || '',
                              unit_price: String(selected?.purchase_price ?? 0),
                            });
                          }}
                          disabled={isSubmitting || isLockedEdit}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                        >
                          <option value="">Pilih Produk</option>
                          {products.map((option) => {
                            const isUsedByOtherRow = selectedProducts.has(option.uuid) && option.uuid !== row.product_uuid;
                            return (
                              <option key={option.uuid} value={option.uuid} disabled={isUsedByOtherRow}>
                                {option.name} ({option.sku})
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={row.unit}
                          onChange={(e) => handleRowChange(row.key, { unit: e.target.value })}
                          disabled={isSubmitting || isLockedEdit || !row.product_uuid}
                          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                        >
                          <option value="">Pilih</option>
                          {(product?.purchase_units || []).map((option) => (
                            <option key={`${row.key}-${option.unit}`} value={option.unit}>
                              {option.unit}
                            </option>
                          ))}
                        </select>
                        {row.product_uuid && row.unit && (
                          <p className="mt-1 text-xs text-gray-500">Faktor: x{factorToBase} {baseUnit}</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={row.quantity}
                          onChange={(e) => handleRowChange(row.key, { quantity: e.target.value })}
                          disabled={isSubmitting || isLockedEdit}
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={row.unit_price}
                          onChange={(e) => handleRowChange(row.key, { unit_price: e.target.value })}
                          disabled={isSubmitting || isLockedEdit}
                          className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={row.discount}
                          onChange={(e) => handleRowChange(row.key, { discount: e.target.value })}
                          disabled={isSubmitting || isLockedEdit}
                          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                        <p>{formatCurrency(rowSubtotal)}</p>
                        {row.product_uuid && row.unit && (
                          <p className="text-xs font-normal text-gray-500">
                            Base: {Number.isFinite(quantityBase) ? quantityBase : 0} {baseUnit}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          disabled={rows.length === 1 || isSubmitting || isLockedEdit}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {fieldErrors.items && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">{fieldErrors.items[0]}</div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isSubmitting || isLockedEdit}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                placeholder="Catatan pembelian (opsional)"
              />
              {fieldErrors.notes && <p className="mt-1 text-xs text-red-600">{fieldErrors.notes[0]}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Ringkasan</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(calculations.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Diskon Item</span>
                <span className="font-medium text-gray-900">{formatCurrency(calculations.itemDiscount)}</span>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Diskon Tambahan</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  disabled={isSubmitting || isLockedEdit}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170] disabled:bg-gray-100"
                />
                {fieldErrors.discount_amount && <p className="mt-1 text-xs text-red-600">{fieldErrors.discount_amount[0]}</p>}
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="text-base font-bold text-gray-900">{formatCurrency(calculations.totalAmount)}</span>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Nominal Bayar (untuk final)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  disabled={isSubmitting || isLockedEdit || !calculations.hasSupplier}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170] disabled:bg-gray-100 disabled:text-gray-500"
                />
                {!calculations.hasSupplier && (
                  <p className="mt-1 text-xs text-gray-500">Tanpa supplier, sistem otomatis set lunas saat final.</p>
                )}
                {fieldErrors.paid_amount && <p className="mt-1 text-xs text-red-600">{fieldErrors.paid_amount[0]}</p>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sisa Hutang (final)</span>
                <span className="font-semibold text-red-700">{formatCurrency(calculations.outstanding)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <Link
            href={mode === 'edit' ? `/app/pos/purchases/${purchaseUuid}` : '/app/pos/purchases'}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              onClick={() => setSubmitIntent('draft')}
              disabled={isSubmitting || isLockedEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>
                {isSubmitting && submitIntent === 'draft'
                  ? 'Menyimpan...'
                  : mode === 'create'
                    ? 'Simpan Draft'
                    : 'Update Draft'}
              </span>
            </button>

            <button
              type="submit"
              onClick={() => setSubmitIntent('final')}
              disabled={isSubmitting || isLockedEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-[#EBC170] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>
                {isSubmitting && submitIntent === 'final'
                  ? 'Menyimpan...'
                  : mode === 'create'
                    ? 'Simpan Final'
                    : 'Finalisasi Pembelian'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
