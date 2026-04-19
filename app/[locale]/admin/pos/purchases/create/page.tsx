'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/toast/ToastContainer';

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
};

type PurchaseRow = {
  key: string;
  product_uuid: string;
  quantity: string;
  unit_price: string;
  discount: string;
};

function createRow(): PurchaseRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_uuid: '',
    quantity: '1',
    unit_price: '0',
    discount: '0',
  };
}

export default function CreatePurchasePage() {
  const router = useRouter();
  const toast = useToast();

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    const outstanding = Math.max(totalAmount - paid, 0);
    const paymentStatus = paid <= 0 ? 'pending' : paid < totalAmount ? 'partial' : 'paid';

    return {
      subtotal,
      itemDiscount,
      globalDiscount,
      totalDiscount,
      totalAmount,
      paid,
      outstanding,
      paymentStatus,
    };
  }, [rows, discountAmount, paidAmount]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const response = await fetch('/api/admin/pos/purchases/options');
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

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
    if (!branchUuid) {
      toast.error('Cabang wajib dipilih');
      return false;
    }
    if (!supplierUuid) {
      toast.error('Supplier wajib dipilih');
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

      const qty = Number(row.quantity);
      const unitPrice = Number(row.unit_price);
      const discount = Number(row.discount || 0);

      if (!Number.isInteger(qty) || qty <= 0) {
        toast.error('Qty item harus bilangan bulat dan lebih dari 0');
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

    if (calculations.globalDiscount < 0) {
      toast.error('Diskon tidak boleh negatif');
      return false;
    }
    if (calculations.totalAmount <= 0) {
      toast.error('Total pembelian harus lebih dari 0');
      return false;
    }
    if (calculations.paid < 0 || calculations.paid > calculations.totalAmount) {
      toast.error('Nominal bayar tidak boleh negatif atau melebihi total');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateBeforeSubmit()) return;

    const payload = {
      branch_uuid: branchUuid,
      supplier_uuid: supplierUuid,
      purchase_date: purchaseDate,
      discount_amount: calculations.globalDiscount,
      paid_amount: calculations.paid,
      notes: notes.trim(),
      items: rows
        .filter((row) => row.product_uuid)
        .map((row) => ({
          product_uuid: row.product_uuid,
          quantity: Number(row.quantity),
          unit_price: Number(row.unit_price),
          discount: Number(row.discount || 0),
        })),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/pos/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        toast.success('Pembelian berhasil disimpan');
        router.push(`/admin/pos/purchases/${result.data.uuid}`);
        return;
      }

      if (result.errors) setFieldErrors(result.errors);
      const message = result.message || 'Gagal menyimpan pembelian';
      setError(message);
      toast.error(message);
    } catch {
      setError('Terjadi kesalahan saat menyimpan pembelian');
      toast.error('Terjadi kesalahan saat menyimpan pembelian');
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pos/purchases" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Pembelian</span>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#142D52]">Tambah Pembelian</h1>
        <p className="mt-1 text-sm text-gray-600">Catat stock in dari supplier dan update stok otomatis.</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cabang</label>
              <select
                value={branchUuid}
                onChange={(e) => setBranchUuid(e.target.value)}
                disabled={isLoadingOptions || isSubmitting}
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Supplier</label>
              <select
                value={supplierUuid}
                onChange={(e) => setSupplierUuid(e.target.value)}
                disabled={isLoadingOptions || isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.uuid} value={supplier.uuid}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {fieldErrors.supplier_uuid && <p className="mt-1 text-xs text-red-600">{fieldErrors.supplier_uuid[0]}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal Pembelian</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              />
              {fieldErrors.purchase_date && <p className="mt-1 text-xs text-red-600">{fieldErrors.purchase_date[0]}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status Pembayaran</label>
              <div className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold ${statusBadgeClass}`}>{statusLabel}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-800">Item Pembelian</h2>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#EBC170] px-3 py-1.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f]"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Baris
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Produk</th>
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
                                unit_price: String(selected?.purchase_price ?? 0),
                              });
                            }}
                            disabled={isLoadingOptions || isSubmitting}
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
                          {product && <p className="mt-1 text-xs text-gray-500">Satuan: {product.unit}</p>}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={row.quantity}
                            onChange={(e) => handleRowChange(row.key, { quantity: e.target.value })}
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">{formatCurrency(rowSubtotal)}</td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            disabled={rows.length === 1 || isSubmitting}
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                  />
                  {fieldErrors.discount_amount && <p className="mt-1 text-xs text-red-600">{fieldErrors.discount_amount[0]}</p>}
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="text-base font-bold text-gray-900">{formatCurrency(calculations.totalAmount)}</span>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">Nominal Bayar</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                  />
                  {fieldErrors.paid_amount && <p className="mt-1 text-xs text-red-600">{fieldErrors.paid_amount[0]}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sisa Hutang</span>
                  <span className="font-semibold text-red-700">{formatCurrency(calculations.outstanding)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Link
              href="/admin/pos/purchases"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingOptions}
              className="inline-flex items-center gap-2 rounded-lg bg-[#EBC170] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#d4ab5f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
