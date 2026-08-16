'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';

interface PaymentMethodFormData {
  code: string;
  name: string;
  type: string;
  account_number: string;
  account_name: string;
  description: string;
  is_active: boolean;
}

interface PaymentMethodFormProps {
  paymentMethodId?: string;
  mode: 'create' | 'edit';
}

export default function PaymentMethodForm({ paymentMethodId, mode }: PaymentMethodFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    code: '',
    name: '',
    type: 'cash',
    account_number: '',
    account_name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (mode === 'edit' && paymentMethodId) {
      fetchPaymentMethod();
    }
  }, [mode, paymentMethodId]);

  const fetchPaymentMethod = async () => {
    if (!paymentMethodId) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/app/pos/payment-methods/${paymentMethodId}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setFormData({
          code: result.data.code || '',
          name: result.data.name || '',
          type: result.data.type || 'cash',
          account_number: result.data.account_number || '',
          account_name: result.data.account_name || '',
          description: result.data.description || '',
          is_active: result.data.is_active ?? true,
        });
      } else {
        setError(result.message || 'Gagal memuat data metode pembayaran');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const url = mode === 'edit' && paymentMethodId
        ? `/api/app/pos/payment-methods/${paymentMethodId}`
        : '/api/app/pos/payment-methods';
      const method = mode === 'edit' && paymentMethodId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.status === 'success') {
        const successMsg = mode === 'edit' ? 'Metode pembayaran berhasil diperbarui' : 'Metode pembayaran berhasil ditambahkan';
        toast.success(successMsg);
        router.push('/app/pos/payment-methods');
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        const errorMsg = result.message || 'Gagal menyimpan data';
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
        {mode === 'edit' ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
      </h1>

      {error && (
        <Alert variant="error" message={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Kode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.code
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Contoh: CASH"
            />
            {fieldErrors.code && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.code[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.name
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan nama metode"
            />
            {fieldErrors.name && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipe <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.type
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
            >
              <option value="cash">Tunai</option>
              <option value="bank_transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
              <option value="e_wallet">E-Wallet</option>
              <option value="credit_card">Kartu Kredit</option>
              <option value="debit_card">Kartu Debit</option>
              <option value="other">Lainnya</option>
            </select>
            {fieldErrors.type && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.type[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Rekening/Akun
            </label>
            <input
              type="text"
              id="account_number"
              name="account_number"
              value={formData.account_number}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.account_number
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan nomor rekening/akun"
            />
            {fieldErrors.account_number && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.account_number[0]}</div>
            )}
          </div>

          <div>
            <label htmlFor="account_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Pemilik Akun
            </label>
            <input
              type="text"
              id="account_name"
              name="account_name"
              value={formData.account_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.account_name
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder="Masukkan nama pemilik akun"
            />
            {fieldErrors.account_name && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.account_name[0]}</div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170]"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
              Aktif
            </label>
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
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white resize-none ${
              fieldErrors.description
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
            }`}
            placeholder="Masukkan deskripsi metode"
          />
          {fieldErrors.description && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.description[0]}</div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link href="/app/pos/payment-methods">
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
