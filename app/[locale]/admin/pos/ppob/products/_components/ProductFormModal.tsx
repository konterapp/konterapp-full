'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { PpobProductLocal } from './types';

const CATEGORIES = ['PULSA', 'DATA', 'PLNPRA', 'PLNPASCA', 'TELKOM', 'PDAM', 'BPJS', 'EMONEY', 'GAME'];

interface ProductFormModalProps {
  product: PpobProductLocal | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
  const isEdit = !!product;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    provider: product?.provider || 'rajabiller',
    provider_product_code: product?.provider_product_code || '',
    product_name: product?.product_name || '',
    category: product?.category || 'PULSA',
    type: product?.type || 'prepaid',
    base_price: product?.base_price?.toString() || '',
    admin_fee: product?.admin_fee?.toString() || '0',
    selling_price: product?.selling_price?.toString() || '',
    is_active: product?.is_active ?? true,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        provider: form.provider,
        provider_product_code: form.provider_product_code,
        product_name: form.product_name,
        category: form.category,
        type: form.type,
        base_price: Number(form.base_price),
        admin_fee: Number(form.admin_fee || 0),
        selling_price: Number(form.selling_price),
        is_active: form.is_active,
      };

      const response = await fetch(
        isEdit && product ? `/api/admin/pos/ppob-products/${product.uuid}` : '/api/admin/pos/ppob-products',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (result.status === 'success') {
        onSaved();
      } else {
        setError(result.message || 'Gagal menyimpan produk');
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold text-[#142D52]">{isEdit ? 'Edit Produk PPOB' : 'Tambah Produk PPOB'}</h3>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Provider</label>
              <select
                value={form.provider}
                onChange={(e) => handleChange('provider', e.target.value)}
                className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              >
                <option value="rajabiller">RajaBiller</option>
                <option value="digiflazz">Digiflazz</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tipe</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              >
                <option value="prepaid">Prabayar</option>
                <option value="postpaid">Pascabayar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Kode Produk Provider</label>
            <input
              type="text"
              value={form.provider_product_code}
              onChange={(e) => handleChange('provider_product_code', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Nama Produk</label>
            <input
              type="text"
              value={form.product_name}
              onChange={(e) => handleChange('product_name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Harga Dasar</label>
              <input
                type="number"
                value={form.base_price}
                onChange={(e) => handleChange('base_price', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Biaya Admin</label>
              <input
                type="number"
                value={form.admin_fee}
                onChange={(e) => handleChange('admin_fee', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Harga Jual</label>
              <input
                type="number"
                value={form.selling_price}
                onChange={(e) => handleChange('selling_price', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="cursor-pointer rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Aktif
            </label>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#142D52] px-4 py-2 text-sm font-medium text-white hover:bg-[#142D52]/90 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
