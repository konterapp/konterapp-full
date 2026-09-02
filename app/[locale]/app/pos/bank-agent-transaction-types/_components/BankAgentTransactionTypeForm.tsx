'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';
import {
  getBankAgentTransactionTypes,
  createBankAgentTransactionType,
  updateBankAgentTransactionType,
} from '@/lib/api/app/bank-agent-transaction';

interface BankAgentTransactionTypeFormData {
  name: string;
  cash_direction: 'in' | 'out';
  is_active: boolean;
  sort_order: string;
}

interface BankAgentTransactionTypeFormProps {
  typeUuid?: string;
  mode: 'create' | 'edit';
}

export default function BankAgentTransactionTypeForm({ typeUuid, mode }: BankAgentTransactionTypeFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<BankAgentTransactionTypeFormData>({
    name: '',
    cash_direction: 'out',
    is_active: true,
    sort_order: '',
  });

  useEffect(() => {
    if (mode === 'edit' && typeUuid) {
      fetchType();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typeUuid]);

  const fetchType = async () => {
    if (!typeUuid) return;
    try {
      setIsLoadingData(true);
      const result = await getBankAgentTransactionTypes();
      const found = result.data?.find((t) => t.uuid === typeUuid);
      if (found) {
        setFormData({
          name: found.name,
          cash_direction: found.cash_direction,
          is_active: found.is_active,
          sort_order: String(found.sort_order ?? 0),
        });
      } else {
        setError('Jenis transaksi tidak ditemukan');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        cash_direction: formData.cash_direction,
        is_active: formData.is_active,
        ...(formData.sort_order !== '' ? { sort_order: Number(formData.sort_order) || 0 } : {}),
      };

      const result =
        mode === 'edit' && typeUuid
          ? await updateBankAgentTransactionType(typeUuid, payload)
          : await createBankAgentTransactionType(payload);

      if (result.status === 'success') {
        const successMsg = mode === 'edit' ? 'Jenis transaksi berhasil diperbarui' : 'Jenis transaksi berhasil ditambahkan';
        toast.success(successMsg);
        router.push('/app/pos/bank-agent-transaction-types');
      } else {
        if (result.errors) setFieldErrors(result.errors);
        const errorMsg = result.message || `Gagal ${mode === 'edit' ? 'mengubah' : 'menambah'} jenis transaksi`;
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      const errorMsg = 'Terjadi kesalahan. Silakan coba lagi.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {mode === 'edit' ? 'Edit Jenis Transaksi Agen Bank' : 'Tambah Jenis Transaksi Agen Bank'}
      </h1>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nama Jenis Transaksi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.name ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
            placeholder="Mis. Tarik Tunai, Setor Tunai, Pembayaran BPJS"
          />
          {fieldErrors.name && <div className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</div>}
        </div>

        <div>
          <label htmlFor="cash_direction" className="block text-sm font-medium text-gray-700 mb-2">
            Arah Kas <span className="text-red-500">*</span>
          </label>
          <select
            id="cash_direction"
            name="cash_direction"
            value={formData.cash_direction}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${fieldErrors.cash_direction ? 'border-red-500' : 'border-gray-200 focus:ring-[#EBC170]'}`}
          >
            <option value="out">Kas Masuk (customer bayar ke kasir -- umum: setor tunai, bayar BPJS/listrik/dst)</option>
            <option value="in">Kas Keluar (kasir bayar ke customer -- mis. Tarik Tunai)</option>
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Menentukan arah mutasi saldo akun Agen Bank & kas otomatis saat transaksi jenis ini dibuat.
          </p>
          {fieldErrors.cash_direction && <div className="mt-1 text-sm text-red-600">{fieldErrors.cash_direction[0]}</div>}
        </div>

        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-2">
            Urutan Tampil
          </label>
          <input
            type="number"
            id="sort_order"
            name="sort_order"
            value={formData.sort_order}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] bg-white"
            placeholder="Kosongkan untuk otomatis"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170] cursor-pointer"
          />
          <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
            Aktif (tampil sebagai pilihan saat buat transaksi)
          </label>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link href="/app/pos/bank-agent-transaction-types">
            <Button type="button" variant="light" icon={X}>Batal</Button>
          </Link>
          <Button type="submit" variant="warning" icon={Save} isLoading={isLoading}>Simpan</Button>
        </div>
      </form>
    </div>
  );
}
