'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ArrowRight, Plus, Save, Trash2, X } from 'lucide-react';
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

type TransferRow = {
  key: string;
  product_uuid: string;
  quantity: string;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

function createRow(): TransferRow {
  return {
    key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_uuid: '',
    quantity: '',
  };
}

export default function StockTransferCreateForm() {
  const router = useRouter();
  const toast = useToast();

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [fromBranches, setFromBranches] = useState<BranchOption[]>([]);
  const [toBranches, setToBranches] = useState<BranchOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [fromBranchUuid, setFromBranchUuid] = useState('');
  const [toBranchUuid, setToBranchUuid] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<TransferRow[]>([createRow()]);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductOption>();
    for (const product of products) map.set(product.uuid, product);
    return map;
  }, [products]);

  const selectedProducts = useMemo(() => new Set(rows.map((row) => row.product_uuid).filter(Boolean)), [rows]);

  // Cabang tujuan tidak boleh sama dengan asal -- disaring dari sisi tampilan
  // supaya tidak ada opsi yang jelas-jelas akan ditolak server.
  const availableToBranches = useMemo(
    () => toBranches.filter((branch) => branch.uuid !== fromBranchUuid),
    [toBranches, fromBranchUuid]
  );
  const availableFromBranches = useMemo(
    () => fromBranches.filter((branch) => branch.uuid !== toBranchUuid),
    [fromBranches, toBranchUuid]
  );

  const fetchOptions = async (nextFromBranchUuid: string) => {
    try {
      setIsLoadingOptions(true);
      const params = new URLSearchParams({ scope: 'form' });
      if (nextFromBranchUuid) params.append('from_branch_uuid', nextFromBranchUuid);

      const response = await fetch(`/api/app/pos/stock-transfers?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setFromBranches(result.data.from_branches || []);
        setToBranches(result.data.to_branches || []);
        setProducts(result.data.products || []);
      } else {
        setFromBranches([]);
        setToBranches([]);
        setProducts([]);
      }
    } catch {
      setFromBranches([]);
      setToBranches([]);
      setProducts([]);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchOptions('');
  }, []);

  useEffect(() => {
    fetchOptions(fromBranchUuid);
    // Daftar produk dgn stok yg ditampilkan mengikuti cabang asal -- baris
    // yang sudah diisi jadi tidak relevan lagi (bisa saja produknya tidak
    // punya stok di cabang asal yang baru), jadi dikosongkan supaya tidak
    // ada pilihan basi yang lolos ke submit.
    setRows([createRow()]);
  }, [fromBranchUuid]);

  const handleRowChange = (key: string, patch: Partial<TransferRow>) => {
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
    if (!fromBranchUuid) {
      toast.error('Cabang asal wajib dipilih');
      return false;
    }
    if (!toBranchUuid) {
      toast.error('Cabang tujuan wajib dipilih');
      return false;
    }
    if (fromBranchUuid === toBranchUuid) {
      toast.error('Cabang asal dan tujuan tidak boleh sama');
      return false;
    }

    const validRows = rows.filter((row) => row.product_uuid || row.quantity !== '');
    if (validRows.length === 0) {
      toast.error('Minimal isi 1 produk untuk transfer');
      return false;
    }

    const seen = new Set<string>();
    for (const row of validRows) {
      if (!row.product_uuid) {
        toast.error('Produk wajib dipilih pada setiap baris yang diisi');
        return false;
      }
      if (seen.has(row.product_uuid)) {
        toast.error('Produk pada dokumen transfer tidak boleh duplikat');
        return false;
      }
      seen.add(row.product_uuid);

      const quantity = Number(row.quantity);
      if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
        toast.error('Qty transfer harus bilangan bulat dan lebih dari 0');
        return false;
      }

      const product = productMap.get(row.product_uuid);
      if (product && quantity > product.current_stock) {
        toast.error(`Qty ${product.name} melebihi stok tersedia di cabang asal (${product.current_stock})`);
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

    const items = rows
      .filter((row) => row.product_uuid || row.quantity !== '')
      .map((row) => ({
        product_uuid: row.product_uuid,
        quantity: Number(row.quantity),
      }));

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/app/pos/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_branch_uuid: fromBranchUuid,
          to_branch_uuid: toBranchUuid,
          notes: notes.trim(),
          items,
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        toast.success('Transfer stok berhasil disimpan');
        router.push('/app/pos/stock-transfers');
      } else {
        if (result.errors) setFieldErrors(result.errors);
        const msg = result.message || 'Gagal menyimpan transfer stok';
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Transfer Stok Antar Cabang</h1>
      <p className="text-sm text-gray-600 mb-6">Pindahkan stok fisik satu atau beberapa produk dari satu cabang ke cabang lain.</p>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cabang Asal <span className="text-red-500">*</span></label>
            <select
              value={fromBranchUuid}
              onChange={(e) => setFromBranchUuid(e.target.value)}
              className="w-full min-h-11 px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
              disabled={isSubmitting}
            >
              <option value="">Pilih Cabang Asal</option>
              {availableFromBranches.map((branch) => (
                <option key={branch.uuid} value={branch.uuid}>{branch.name}</option>
              ))}
            </select>
            {fieldErrors.from_branch_uuid && <p className="mt-1 text-sm text-red-600">{fieldErrors.from_branch_uuid[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cabang Tujuan <span className="text-red-500">*</span></label>
            <select
              value={toBranchUuid}
              onChange={(e) => setToBranchUuid(e.target.value)}
              className="w-full min-h-11 px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
              disabled={isSubmitting || !fromBranchUuid}
            >
              <option value="">{fromBranchUuid ? 'Pilih Cabang Tujuan' : 'Pilih cabang asal dulu'}</option>
              {availableToBranches.map((branch) => (
                <option key={branch.uuid} value={branch.uuid}>{branch.name}</option>
              ))}
            </select>
            {fieldErrors.to_branch_uuid && <p className="mt-1 text-sm text-red-600">{fieldErrors.to_branch_uuid[0]}</p>}
          </div>
        </div>

        {fromBranchUuid && toBranchUuid && (
          <div className="flex items-center gap-2 rounded-lg bg-[#FDF6E9] border border-[#EBC170]/40 px-4 py-2.5 text-sm font-medium text-gray-800">
            <span className="truncate">{fromBranches.find((b) => b.uuid === fromBranchUuid)?.name}</span>
            <ArrowRight className="w-4 h-4 shrink-0 text-[#c99a3f]" />
            <span className="truncate">{toBranches.find((b) => b.uuid === toBranchUuid)?.name}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-11 px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
            placeholder="Contoh: kirim stok tambahan untuk akhir pekan"
            disabled={isSubmitting}
          />
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Item Produk Transfer</h2>
            <button
              type="button"
              onClick={addRow}
              disabled={!fromBranchUuid}
              className="inline-flex min-h-11 items-center gap-1.5 px-3 py-1.5 bg-[#EBC170] hover:bg-[#d4ab5f] rounded-lg text-xs font-semibold text-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris
            </button>
          </div>

          {!fromBranchUuid ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">Pilih cabang asal dulu untuk melihat produk yang punya stok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Produk</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Stok Tersedia</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Qty Transfer</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700">Satuan</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-700 w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const selected = row.product_uuid ? productMap.get(row.product_uuid) : null;

                    return (
                      <tr key={row.key} className="border-b border-gray-100">
                        <td className="px-4 py-2">
                          <select
                            value={row.product_uuid}
                            onChange={(e) => handleRowChange(row.key, { product_uuid: e.target.value })}
                            className="w-full min-h-11 px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
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

                        <td className="px-4 py-2 text-sm text-gray-700">{selected ? selected.current_stock : '-'}</td>

                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={1}
                            max={selected?.current_stock}
                            step={1}
                            value={row.quantity}
                            onChange={(e) => handleRowChange(row.key, { quantity: e.target.value })}
                            className="w-full min-h-11 px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
                            placeholder="0"
                            disabled={isSubmitting || !row.product_uuid}
                          />
                        </td>

                        <td className="px-4 py-2 text-sm text-gray-700">{selected?.unit || '-'}</td>

                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            disabled={rows.length === 1 || isSubmitting}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
          )}

          {fieldErrors.items && (
            <div className="px-4 py-2 text-sm text-red-600 border-t border-red-100 bg-red-50">
              {fieldErrors.items[0]}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 pt-4 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="light"
            icon={X}
            className="w-full min-h-11 justify-center sm:w-auto"
            onClick={() => router.push('/app/pos/stock-transfers')}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="warning"
            icon={Save}
            isLoading={isSubmitting}
            className="w-full min-h-11 justify-center sm:w-auto"
          >
            Simpan Transfer
          </Button>
        </div>
      </form>
    </div>
  );
}
