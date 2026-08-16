'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/toast/ToastContainer';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type BranchOption = {
  uuid: string;
  name: string;
};

type ProductOption = {
  uuid: string;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
};

type OpnameRow = {
  key: string;
  product_uuid: string;
  actual_stock: string;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

function createRow(): OpnameRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_uuid: '',
    actual_stock: '',
  };
}

export default function StockOpnameCreateForm() {
  const router = useRouter();
  const toast = useToast();

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [branchUuid, setBranchUuid] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<OpnameRow[]>([createRow()]);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductOption>();
    for (const product of products) {
      map.set(product.uuid, product);
    }
    return map;
  }, [products]);

  const selectedProducts = useMemo(() => new Set(rows.map((row) => row.product_uuid).filter(Boolean)), [rows]);

  const fetchOptions = async (nextBranchUuid: string) => {
    try {
      setIsLoadingOptions(true);

      const params = new URLSearchParams({ scope: 'form' });
      if (nextBranchUuid) params.append('branch_uuid', nextBranchUuid);

      const response = await fetch(`/api/app/pos/stock-opname?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setBranches(result.data.branches || []);
        setProducts(result.data.products || []);
      } else {
        setBranches([]);
        setProducts([]);
      }
    } catch {
      setBranches([]);
      setProducts([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchOptions('');
  }, []);

  useEffect(() => {
    fetchOptions(branchUuid);
  }, [branchUuid]);

  const handleRowChange = (key: string, patch: Partial<OpnameRow>) => {
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

    const validRows = rows.filter((row) => row.product_uuid || row.actual_stock !== '');
    if (validRows.length === 0) {
      toast.error('Minimal isi 1 produk untuk opname');
      return false;
    }

    const seen = new Set<string>();
    for (const row of validRows) {
      if (!row.product_uuid) {
        toast.error('Produk wajib dipilih pada setiap baris yang diisi');
        return false;
      }
      if (seen.has(row.product_uuid)) {
        toast.error('Produk pada dokumen opname tidak boleh duplikat');
        return false;
      }
      seen.add(row.product_uuid);

      const actualStock = Number(row.actual_stock);
      if (!Number.isFinite(actualStock) || !Number.isInteger(actualStock) || actualStock < 0) {
        toast.error('Stok aktual harus bilangan bulat dan tidak boleh negatif');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateBeforeSubmit()) {
      return;
    }

    const items = rows
      .filter((row) => row.product_uuid || row.actual_stock !== '')
      .map((row) => ({
        product_uuid: row.product_uuid,
        actual_stock: Number(row.actual_stock),
      }));

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/app/pos/stock-opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_uuid: branchUuid,
          notes: notes.trim(),
          items,
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Stok opname berhasil disimpan');
        router.push('/app/pos/stock-opname');
      } else {
        if (result.errors) setFieldErrors(result.errors);
        const msg = result.message || 'Gagal menyimpan stok opname';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Buat Stok Opname</h1>
      <p className="text-sm text-gray-600 mb-6">Satu dokumen opname dapat berisi banyak produk sekaligus.</p>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cabang <span className="text-red-500">*</span></label>
            <select
              value={branchUuid}
              onChange={(e) => setBranchUuid(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
              disabled={isSubmitting || isLoadingOptions}
            >
              <option value="">Pilih Cabang</option>
              {branches.map((branch) => (
                <option key={branch.uuid} value={branch.uuid}>
                  {branch.name}
                </option>
              ))}
            </select>
            {fieldErrors.branch_uuid && <p className="mt-1 text-sm text-red-600">{fieldErrors.branch_uuid[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
              placeholder="Contoh: opname mingguan gudang"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Item Produk Opname</h2>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] hover:bg-[#d4ab5f] rounded-lg text-xs font-semibold text-gray-900 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Produk</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Stok Sistem</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Stok Aktual</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Satuan</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700 w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const selected = row.product_uuid ? productMap.get(row.product_uuid) : null;
                  const currentStock = selected ? Number(selected.current_stock || 0) : 0;

                  return (
                    <tr key={row.key} className="border-b border-gray-100">
                      <td className="px-4 py-2">
                        <select
                          value={row.product_uuid}
                          onChange={(e) => {
                            const nextProductUuid = e.target.value;
                            const product = productMap.get(nextProductUuid);
                            handleRowChange(row.key, {
                              product_uuid: nextProductUuid,
                              actual_stock: row.actual_stock || String(product?.current_stock ?? ''),
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
                          disabled={isSubmitting || isLoadingOptions}
                        >
                          <option value="">Pilih Produk</option>
                          {products.map((product) => {
                            const isUsedByOtherRow = selectedProducts.has(product.uuid) && product.uuid !== row.product_uuid;
                            return (
                              <option key={product.uuid} value={product.uuid} disabled={isUsedByOtherRow}>
                                {product.name} ({product.sku})
                              </option>
                            );
                          })}
                        </select>
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-700">{selected ? currentStock : '-'}</td>

                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={row.actual_stock}
                          onChange={(e) => handleRowChange(row.key, { actual_stock: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
                          placeholder="0"
                          disabled={isSubmitting}
                        />
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-700">{selected?.unit || '-'}</td>

                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          disabled={rows.length === 1 || isSubmitting}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {fieldErrors.items && (
            <div className="px-4 py-2 text-sm text-red-600 border-t border-red-100 bg-red-50">
              {fieldErrors.items[0]}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="light" icon={X} onClick={() => router.push('/app/pos/stock-opname')}>
            Batal
          </Button>
          <Button type="submit" variant="warning" icon={Save} isLoading={isSubmitting}>
            Simpan Opname
          </Button>
        </div>
      </form>
    </div>
  );
}
