'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface CustomerFormProps {
  customerId?: string;
  mode: 'create' | 'edit';
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

export default function CustomerForm({ customerId, mode }: CustomerFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/admin/pos/customers/${customerId}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setFormData({
          name: result.data.name || '',
          phone: result.data.phone || '',
          email: result.data.email || '',
          address: result.data.address || '',
        });
      } else {
        setError(result.message || 'Gagal memuat data pelanggan');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingData(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (mode === 'edit' && customerId) {
      fetchCustomer();
    }
  }, [mode, customerId, fetchCustomer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const isEdit = mode === 'edit' && customerId;
      const url = isEdit ? `/api/admin/pos/customers/${customerId}` : '/api/admin/pos/customers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.status === 'success') {
        const successMsg = isEdit ? 'Pelanggan berhasil diperbarui' : 'Pelanggan berhasil ditambahkan';
        toast.success(successMsg);
        router.push('/admin/pos/customers');
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        const errorMsg = result.message || `Gagal ${isEdit ? 'mengubah' : 'menambah'} pelanggan`;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err);
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
        {mode === 'edit' ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
      </h1>

      {error && (
        <Alert variant="error" message={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Pelanggan <span className="text-red-500">*</span>
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
              placeholder="Masukkan nama pelanggan"
            />
            {fieldErrors.name && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Telepon
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

          <div className="md:col-span-2">
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
            placeholder="Masukkan alamat pelanggan"
          />
          {fieldErrors.address && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.address[0]}</div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link href="/admin/pos/customers">
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
