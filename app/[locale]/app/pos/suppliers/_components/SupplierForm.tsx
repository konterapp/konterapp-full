'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';

interface SupplierFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
}

interface SupplierFormProps {
  supplierId?: string;
  mode: 'create' | 'edit';
}

export default function SupplierForm({ supplierId, mode }: SupplierFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true,
  });

  useEffect(() => {
    if (mode === 'edit' && supplierId) {
      fetchSupplier();
    }
  }, [mode, supplierId]);

  const fetchSupplier = async () => {
    if (!supplierId) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/app/pos/suppliers/${supplierId}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setFormData({
          name: result.data.name,
          contact_person: result.data.contact_person || '',
          phone: result.data.phone,
          email: result.data.email || '',
          address: result.data.address || '',
          is_active: result.data.is_active ?? true,
        });
      } else {
        setError(result.message || 'Gagal memuat data supplier');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const url = mode === 'edit' && supplierId ? `/api/app/pos/suppliers/${supplierId}` : '/api/app/pos/suppliers';
      const method = mode === 'edit' && supplierId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.status === 'success') {
        const successMsg = mode === 'edit' ? 'Supplier berhasil diperbarui' : 'Supplier berhasil ditambahkan';
        toast.success(successMsg);
        router.push('/app/pos/suppliers');
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        const errorMsg = result.message || `Gagal ${mode === 'edit' ? 'mengubah' : 'menambah'} supplier`;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.';
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
        {mode === 'edit' ? 'Edit Supplier' : 'Tambah Supplier Baru'}
      </h1>

      {error && (
        <Alert variant="error" message={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Supplier <span className="text-red-500">*</span>
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
              placeholder="Masukkan nama supplier"
            />
            {fieldErrors.name && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Kontak Person
            </label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.contact_person
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan nama kontak person"
            />
            {fieldErrors.contact_person && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.contact_person[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.phone
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan nomor telepon"
            />
            {fieldErrors.phone && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.phone[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.email
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan email"
            />
            {fieldErrors.email && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</div>
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
              Supplier Aktif
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Alamat
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white resize-none ${
              fieldErrors.address
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
            }`}
            placeholder="Masukkan alamat lengkap supplier"
          />
          {fieldErrors.address && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.address[0]}</div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link href="/app/pos/suppliers">
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
