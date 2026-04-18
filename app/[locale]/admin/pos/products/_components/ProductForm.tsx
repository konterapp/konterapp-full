'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, Link } from '@/i18n/navigation';
import { Save, X, Upload, Trash2, Star } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';

interface Category {
  uuid: string;
  name: string;
}

interface BranchSimple {
  uuid: string;
  code: string;
  name: string;
  is_active: boolean;
}

interface ProductImageData {
  uuid: string;
  url: string;
  is_primary: boolean;
}

interface ProductFormData {
  category_uuid: string;
  name: string;
  sku: string;
  barcode: string;
  additional_barcodes: string;
  purchase_price: number;
  selling_price: number;
  wholesale_price: number;
  min_stock: number;
  unit: string;
  unit_conversions: {
    unit: string;
    factor_to_base: string;
    is_active: boolean;
  }[];
  branch_prices: {
    branch_uuid: string;
    branch_name: string;
    branch_code: string;
    selling_price: number;
    wholesale_price: number;
  }[];
  is_active: boolean;
}

interface ProductFormProps {
  productId?: string;
  mode: 'create' | 'edit';
}

interface ImagePreview {
  id: string;
  src: string;
  file?: File;
  existingUuid?: string;
  isPrimary: boolean;
}

let previewIdCounter = 0;
const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pcs' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'kg', label: 'Kg' },
  { value: 'gram', label: 'Gram' },
  { value: 'liter', label: 'Liter' },
  { value: 'meter', label: 'Meter' },
  { value: 'unit', label: 'Unit' },
  { value: 'bungkus', label: 'Bungkus' },
  { value: 'strip', label: 'Strip' },
];

const createEmptyUnitConversion = () => ({
  unit: '',
  factor_to_base: '',
  is_active: false,
});

const createDefaultUnitConversions = () => (
  [createEmptyUnitConversion()]
);

export default function ProductForm({ productId, mode }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<BranchSimple[]>([]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [deletedImageUuids, setDeletedImageUuids] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    category_uuid: '',
    name: '',
    sku: '',
    barcode: '',
    additional_barcodes: '',
    purchase_price: 0,
    selling_price: 0,
    wholesale_price: 0,
    min_stock: 0,
    unit: '',
    unit_conversions: createDefaultUnitConversions(),
    branch_prices: [],
    is_active: true,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        per_page: '200',
        sort_by: 'name',
        sort_order: 'asc',
      });
      const response = await fetch(`/api/admin/pos/categories?${params.toString()}`);
      const result = await response.json();

      if (result.status === 'success' && result.data?.data) {
        setCategories(result.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/admin/pos/products/${productId}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setFormData({
          category_uuid: result.data.category_uuid,
          name: result.data.name,
          sku: result.data.sku,
          barcode: result.data.barcode || '',
          additional_barcodes: Array.isArray(result.data.additional_barcodes)
            ? result.data.additional_barcodes.join(',')
            : '',
          purchase_price: Number(result.data.purchase_price || 0),
          selling_price: Number(result.data.selling_price || 0),
          wholesale_price: Number(result.data.wholesale_price || 0),
          min_stock: Number(result.data.min_stock || 0),
          unit: result.data.unit || '',
          unit_conversions: Array.isArray(result.data.unit_conversions) && result.data.unit_conversions.length > 0
            ? result.data.unit_conversions.map((row: { unit?: string; factor_to_base?: number | string; is_active?: boolean }) => ({
              unit: row.unit || '',
              factor_to_base: row.factor_to_base !== undefined && row.factor_to_base !== null ? String(row.factor_to_base) : '',
              is_active: Boolean(row.is_active),
            }))
            : createDefaultUnitConversions(),
          branch_prices: Array.isArray(result.data.branch_prices)
            ? result.data.branch_prices.map((row: {
              branch_uuid?: string;
              branch_name?: string;
              branch_code?: string;
              selling_price?: number;
              wholesale_price?: number;
            }) => ({
              branch_uuid: row.branch_uuid || '',
              branch_name: row.branch_name || '',
              branch_code: row.branch_code || '',
              selling_price: Number(row.selling_price || 0),
              wholesale_price: Number(row.wholesale_price || 0),
            }))
            : [],
          is_active: result.data.is_active ?? true,
        });

        if (result.data.images && result.data.images.length > 0) {
          const existingPreviews: ImagePreview[] = result.data.images.map((img: ProductImageData) => ({
            id: `existing-${img.uuid}`,
            src: img.url,
            existingUuid: img.uuid,
            isPrimary: img.is_primary,
          }));

          const hasPrimary = existingPreviews.some(preview => preview.isPrimary);
          if (!hasPrimary && existingPreviews.length > 0) {
            existingPreviews[0].isPrimary = true;
          }

          setImagePreviews(existingPreviews);
        }
      } else {
        setError(result.message || 'Gagal memuat data produk');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.';
      setError(errorMsg);
    } finally {
      setIsLoadingData(false);
    }
  }, [productId]);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/pos/branches/list');
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const activeBranches: BranchSimple[] = result.data.filter((b: BranchSimple) => b.is_active);
        setBranches(activeBranches);

        setFormData(prev => {
          const currentByBranch = new Map(prev.branch_prices.map((row) => [row.branch_uuid, row]));
          return {
            ...prev,
            branch_prices: activeBranches.map(branch => {
              const existing = currentByBranch.get(branch.uuid);
              return {
                branch_uuid: branch.uuid,
                branch_name: branch.name,
                branch_code: branch.code,
                selling_price: existing?.selling_price ?? 0,
                wholesale_price: existing?.wholesale_price ?? 0,
              };
            }),
          };
        });
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchBranches();
    if (mode === 'edit' && productId) {
      fetchProduct();
    }
  }, [mode, productId, fetchCategories, fetchBranches, fetchProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let finalValue: string | number | boolean = value;

    if (type === 'number') {
      finalValue = value === '' ? 0 : parseFloat(value);
    } else if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleUnitConversionChange = (
    index: number,
    field: 'unit' | 'factor_to_base' | 'is_active',
    value: string | boolean
  ) => {
    setFormData(prev => {
      const rows = [...prev.unit_conversions];
      rows[index] = {
        ...rows[index],
        [field]: value,
      };
      return {
        ...prev,
        unit_conversions: rows,
      };
    });
  };

  const handleAddUnitConversion = () => {
    setFormData(prev => ({
      ...prev,
      unit_conversions: [...prev.unit_conversions, createEmptyUnitConversion()],
    }));
  };

  const handleRemoveUnitConversion = (index: number) => {
    setFormData(prev => {
      if (prev.unit_conversions.length <= 1) {
        return {
          ...prev,
          unit_conversions: [createEmptyUnitConversion()],
        };
      }
      return {
        ...prev,
        unit_conversions: prev.unit_conversions.filter((_, i) => i !== index),
      };
    });
  };

  const handleBranchPriceChange = (
    branchUuid: string,
    field: 'selling_price' | 'wholesale_price',
    value: string
  ) => {
    const nextValue = value === '' ? 0 : parseFloat(value);
    setFormData(prev => ({
      ...prev,
      branch_prices: prev.branch_prices.map(row => (
        row.branch_uuid === branchUuid
          ? { ...row, [field]: Number.isNaN(nextValue) ? 0 : nextValue }
          : row
      )),
    }));
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview: ImagePreview = {
          id: `new-${++previewIdCounter}`,
          src: reader.result as string,
          file,
          isPrimary: false,
        };
        setImagePreviews(prev => {
          const shouldBePrimary = prev.length === 0;
          return [...prev, { ...preview, isPrimary: shouldBePrimary }];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setImagePreviews(prev => {
      const removing = prev.find(p => p.id === id);
      const remaining = prev.filter(p => p.id !== id);

      if (removing?.existingUuid) {
        setDeletedImageUuids(uuids => [...uuids, removing.existingUuid!]);
      }

      if (removing?.isPrimary && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }

      return remaining;
    });
  };

  const handleSetPrimary = (id: string) => {
    setImagePreviews(prev => prev.map(p => ({ ...p, isPrimary: p.id === id })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append('category_uuid', formData.category_uuid);
      fd.append('name', formData.name);
      fd.append('sku', formData.sku);
      fd.append('barcode', formData.barcode || '');
      fd.append('additional_barcodes', formData.additional_barcodes || '');
      fd.append('purchase_price', String(formData.purchase_price || 0));
      fd.append('selling_price', String(formData.selling_price));
      fd.append('wholesale_price', String(formData.wholesale_price || 0));
      fd.append('min_stock', String(formData.min_stock || 0));
      fd.append('unit', formData.unit || 'pcs');
      fd.append(
        'unit_conversions',
        JSON.stringify(
          formData.unit_conversions
            .filter((row) => row.unit && row.factor_to_base !== '')
            .map((row) => ({
              unit: row.unit,
              factor_to_base: Number(row.factor_to_base),
              is_active: row.is_active,
            }))
        )
      );
      fd.append(
        'branch_prices',
        JSON.stringify(
          formData.branch_prices.map((row) => ({
            branch_uuid: row.branch_uuid,
            selling_price: Number(row.selling_price || 0),
            wholesale_price: Number(row.wholesale_price || 0),
          }))
        )
      );
      fd.append('is_active', formData.is_active ? '1' : '0');

      const newImages = imagePreviews.filter(p => p.file);
      newImages.forEach(p => {
        fd.append('images[]', p.file!);
      });

      let url = '/api/admin/pos/products';
      let method = 'POST';

      if (mode === 'edit' && productId) {
        url = `/api/admin/pos/products/${productId}`;
        method = 'PATCH';

        deletedImageUuids.forEach(uuid => {
          fd.append('delete_images[]', uuid);
        });

        const primaryPreview = imagePreviews.find(p => p.isPrimary);
        if (primaryPreview?.existingUuid) {
          fd.append('primary_image', primaryPreview.existingUuid);
        }
      }

      const response = await fetch(url, {
        method,
        body: fd,
      });
      const result = await response.json();

      if (result.status === 'success') {
        const successMsg = mode === 'edit' ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan';
        toast.success(successMsg);
        router.push('/admin/pos/products');
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        const errorMsg = result.message || `Gagal ${mode === 'edit' ? 'mengubah' : 'menambah'} produk`;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error
        ? err.message
        : 'Terjadi kesalahan. Silakan coba lagi.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-gray-500">Memuat data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {mode === 'edit' ? 'Edit Produk' : 'Tambah Produk'}
      </h1>

      {error && (
        <Alert variant="error" message={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
              Kode Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.sku
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan kode produk"
            />
            {fieldErrors.sku && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.sku[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
            </label>
            <input
              type="text"
              id="barcode"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.barcode
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan barcode"
            />
            {fieldErrors.barcode && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.barcode[0]}</div>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="additional_barcodes" className="block text-sm font-medium text-gray-700 mb-2">
              Barcode Tambahan
            </label>
            <input
              type="text"
              id="additional_barcodes"
              name="additional_barcodes"
              value={formData.additional_barcodes}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] bg-white"
              placeholder="8991...,8992..."
            />
            <p className="mt-1 text-xs text-gray-500">Pisahkan dengan koma, contoh: 8991...,8992...</p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.name
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan nama produk"
            />
            {fieldErrors.name && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="category_uuid" className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              id="category_uuid"
              name="category_uuid"
              value={formData.category_uuid}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.category_uuid
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
            >
              <option value="">-</option>
              {categories.map(category => (
                <option key={category.uuid} value={category.uuid}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.category_uuid && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.category_uuid[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
              Satuan
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.unit
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
            >
              <option value="">-</option>
              {UNIT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.unit && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.unit[0]}</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-800">Konversi Multi-Satuan (opsional)</h3>
            <button
              type="button"
              onClick={handleAddUnitConversion}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border border-gray-200 hover:border-[#EBC170] hover:text-[#142D52] transition-colors"
            >
              + Tambah Satuan
            </button>
          </div>
          {formData.unit_conversions.map((row, index) => (
            <div key={`unit-conversion-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-gray-600 mb-1">Pilih Satuan</label>
                <select
                  value={row.unit}
                  onChange={(e) => handleUnitConversionChange(index, 'unit', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] bg-white"
                >
                  <option value="">Pilih Satuan</option>
                  {UNIT_OPTIONS.map(option => (
                    <option key={`${index}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-gray-600 mb-1">Faktor ke base (x)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.factor_to_base}
                  onChange={(e) => handleUnitConversionChange(index, 'factor_to_base', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] bg-white"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Aktif</label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) => handleUnitConversionChange(index, 'is_active', e.target.checked)}
                        className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170]"
                      />
                      Ya
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveUnitConversion(index)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="Hapus baris"
                    aria-label="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-500">Contoh: 1 Dus = 12 Pcs, maka faktor ke base = 12.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700 mb-2">
              Harga Beli
            </label>
            <input
              type="number"
              id="purchase_price"
              name="purchase_price"
              value={formData.purchase_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] bg-white"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="selling_price" className="block text-sm font-medium text-gray-700 mb-2">
              Harga Jual <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="selling_price"
              name="selling_price"
              value={formData.selling_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.selling_price
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="0"
            />
            {fieldErrors.selling_price && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.selling_price[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="wholesale_price" className="block text-sm font-medium text-gray-700 mb-2">
              Harga Grosir
            </label>
            <input
              type="number"
              id="wholesale_price"
              name="wholesale_price"
              value={formData.wholesale_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] bg-white"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="min_stock" className="block text-sm font-medium text-gray-700 mb-2">
              Stok Minimum
            </label>
            <input
              type="number"
              id="min_stock"
              name="min_stock"
              value={formData.min_stock}
              onChange={handleChange}
              min="0"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.min_stock
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="0"
            />
            {fieldErrors.min_stock && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.min_stock[0]}</div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Harga Cabang (dinamis)</h3>
          {branches.length === 0 && (
            <div className="text-sm text-gray-500">Belum ada data cabang aktif.</div>
          )}
          {formData.branch_prices.map((row) => (
            <div key={row.branch_uuid} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cabang</label>
                <div className="h-10 px-3 flex items-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                  {row.branch_name} ({row.branch_code})
                </div>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Harga Jual Cabang</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.selling_price}
                  onChange={(e) => handleBranchPriceChange(row.branch_uuid, 'selling_price', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] bg-white"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Harga Grosir Cabang</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.wholesale_price}
                  onChange={(e) => handleBranchPriceChange(row.branch_uuid, 'wholesale_price', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-[#EBC170] bg-white"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto Produk
          </label>
          <div className="space-y-3">
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {imagePreviews.map(preview => (
                  <div
                    key={preview.id}
                    className={`relative w-28 h-28 rounded-lg overflow-hidden border-2 group ${
                      preview.isPrimary ? 'border-[#EBC170]' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={preview.src}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {preview.isPrimary && (
                      <span className="absolute top-1 left-1 bg-[#EBC170] text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Utama
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      {!preview.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(preview.id)}
                          className="p-1.5 bg-white rounded-full hover:bg-[#EBC170] transition-colors"
                          title="Jadikan gambar utama"
                        >
                          <Star className="w-3.5 h-3.5 text-gray-700" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(preview.id)}
                        className="p-1.5 bg-white rounded-full hover:bg-red-500 hover:text-white transition-colors"
                        title="Hapus gambar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#EBC170] transition-colors"
                >
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Tambah</span>
                </div>
              </div>
            )}

            {imagePreviews.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#EBC170] transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Klik untuk upload foto produk</span>
                <span className="text-xs text-gray-400 mt-1">No file chosen</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImagesChange}
              className="hidden"
              multiple
            />
            <p className="text-xs text-gray-500">JPG, PNG, WebP — maks. 2 MB</p>
            {(fieldErrors.images || fieldErrors['images.0'] || fieldErrors['images.1'] || fieldErrors['images.2']) && (
              <div className="mt-1 text-sm text-red-600">
                {fieldErrors.images?.[0] || fieldErrors['images.0']?.[0] || fieldErrors['images.1']?.[0] || fieldErrors['images.2']?.[0]}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170]"
          />
          <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
            Produk Aktif
          </label>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link href="/admin/pos/products">
            <Button type="button" variant="light" icon={X}>
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            variant="warning"
            icon={Save}
            isLoading={isLoading}
          >
            Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
