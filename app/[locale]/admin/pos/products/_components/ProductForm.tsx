'use client';

import { useEffect, useRef, useState } from 'react';
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

interface ProductImageData {
  uuid: string;
  url: string;
  is_primary: boolean;
}

interface ProductFormData {
  category_uuid: string;
  name: string;
  sku: string;
  description: string;
  barcode: string;
  selling_price: number;
  min_selling_price: number;
  min_stock: number;
  unit: string;
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

export default function ProductForm({ productId, mode }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [deletedImageUuids, setDeletedImageUuids] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    category_uuid: '',
    name: '',
    sku: '',
    description: '',
    barcode: '',
    selling_price: 0,
    min_selling_price: 0,
    min_stock: 0,
    unit: 'pcs',
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
    if (mode === 'edit' && productId) {
      fetchProduct();
    }
  }, [mode, productId]);

  const fetchCategories = async () => {
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
  };

  const fetchProduct = async () => {
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
          description: result.data.description || '',
          barcode: result.data.barcode || '',
          selling_price: result.data.selling_price,
          min_selling_price: result.data.min_selling_price || 0,
          min_stock: result.data.min_stock || 0,
          unit: result.data.unit || 'pcs',
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoadingData(false);
    }
  };

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
      fd.append('description', formData.description || '');
      fd.append('barcode', formData.barcode || '');
      fd.append('selling_price', String(formData.selling_price));
      fd.append('min_selling_price', String(formData.min_selling_price || 0));
      fd.append('min_stock', String(formData.min_stock || 0));
      fd.append('unit', formData.unit || 'pcs');
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
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
        const errorMsg = err.response?.data?.message || 'Terdapat kesalahan pada form. Silakan periksa kembali.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
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
        {mode === 'edit' ? 'Edit Produk' : 'Tambah Produk Baru'}
      </h1>

      {error && (
        <Alert variant="error" message={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <option value="">Pilih Kategori</option>
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
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
              SKU <span className="text-red-500">*</span>
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
              placeholder="Masukkan SKU produk"
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
              placeholder="Masukkan barcode (opsional)"
            />
            {fieldErrors.barcode && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.barcode[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
              Satuan <span className="text-red-500">*</span>
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
              <option value="pcs">Pcs (Pieces)</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
              <option value="kg">Kg (Kilogram)</option>
              <option value="gram">Gram</option>
              <option value="liter">Liter</option>
              <option value="meter">Meter</option>
              <option value="unit">Unit</option>
              <option value="bungkus">Bungkus</option>
              <option value="strip">Strip</option>
            </select>
            {fieldErrors.unit && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.unit[0]}</div>
            )}
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
            <label htmlFor="min_selling_price" className="block text-sm font-medium text-gray-700 mb-2">
              Harga Jual Minimum
            </label>
            <input
              type="number"
              id="min_selling_price"
              name="min_selling_price"
              value={formData.min_selling_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.min_selling_price
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="0"
            />
            {fieldErrors.min_selling_price && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.min_selling_price[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="min_stock" className="block text-sm font-medium text-gray-700 mb-2">
              Minimal Stok
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk
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
                <span className="text-sm text-gray-500">Klik untuk upload gambar</span>
                <span className="text-xs text-gray-400 mt-1">Bisa pilih beberapa gambar sekaligus</span>
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
            <p className="text-xs text-gray-500">
              Format: JPG, PNG, WebP. Maks 2MB per gambar. Gambar pertama otomatis menjadi gambar utama.
            </p>
            {(fieldErrors.images || fieldErrors['images.0'] || fieldErrors['images.1'] || fieldErrors['images.2']) && (
              <div className="mt-1 text-sm text-red-600">
                {fieldErrors.images?.[0] || fieldErrors['images.0']?.[0] || fieldErrors['images.1']?.[0] || fieldErrors['images.2']?.[0]}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white resize-none ${
              fieldErrors.description
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
            }`}
            placeholder="Masukkan deskripsi produk (opsional)"
          />
          {fieldErrors.description && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.description[0]}</div>
          )}
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
