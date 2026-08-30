'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import RupiahInput from '@/components/ui/RupiahInput';
import { useToast } from '@/components/toast/ToastContainer';
import { getSaldoAccount, createSaldoAccount, updateSaldoAccount } from '@/lib/api/app/saldo';

interface SaldoAccountFormData {
  code: string;
  name: string;
  type: string;
  account_number: string;
  account_name: string;
  description: string;
  is_payment_method: boolean;
  is_active: boolean;
  show_in_shift: boolean;
  sort_order: string;
  is_bank_agent: boolean;
  opening_balance: string;
}

interface SaldoAccountFormProps {
  saldoUuid?: string;
  mode: 'create' | 'edit';
}

export default function SaldoAccountForm({ saldoUuid, mode }: SaldoAccountFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<SaldoAccountFormData>({
    code: '',
    name: '',
    type: 'cash',
    account_number: '',
    account_name: '',
    description: '',
    is_payment_method: true,
    is_active: true,
    show_in_shift: true,
    sort_order: '',
    is_bank_agent: false,
    opening_balance: '0',
  });

  useEffect(() => {
    if (mode === 'edit' && saldoUuid) {
      fetchAccount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, saldoUuid]);

  const fetchAccount = async () => {
    if (!saldoUuid) return;

    try {
      setIsLoadingData(true);
      const result = await getSaldoAccount(saldoUuid);

      if (result.status === 'success' && result.data) {
        setFormData({
          code: result.data.code || '',
          name: result.data.name || '',
          type: result.data.type || 'cash',
          account_number: '',
          account_name: '',
          description: result.data.description || '',
          is_payment_method: result.data.is_payment_method ?? true,
          is_active: result.data.is_active ?? true,
          show_in_shift: result.data.show_in_shift ?? true,
          sort_order: String(result.data.sort_order ?? 0),
          is_bank_agent: result.data.is_bank_agent ?? false,
          opening_balance: '0',
        });
      } else {
        setError(result.message || 'Gagal memuat data akun saldo');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
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
      const payload = {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        is_payment_method: formData.is_payment_method,
        is_active: formData.is_active,
        show_in_shift: formData.show_in_shift,
        is_bank_agent: formData.is_bank_agent,
        // Kosongkan berarti "biarkan server yang atur" -- taruh di urutan
        // paling akhir (lihat posSaldoService.createAccount). Kalau diisi
        // manual, pakai nilai itu.
        ...(formData.sort_order !== '' ? { sort_order: Number(formData.sort_order) || 0 } : {}),
        ...(mode === 'create'
          ? {
              account_number: formData.account_number,
              account_name: formData.account_name,
              opening_balance: Number(formData.opening_balance) || 0,
            }
          : {}),
      };

      const result = mode === 'edit' && saldoUuid
        ? await updateSaldoAccount(saldoUuid, payload)
        : await createSaldoAccount(payload);

      if (result.status === 'success') {
        const successMsg = mode === 'edit' ? 'Akun saldo berhasil diperbarui' : 'Akun saldo berhasil ditambahkan';
        toast.success(successMsg);
        const targetUuid = result.data?.uuid || saldoUuid;
        router.push(targetUuid ? `/app/pos/saldo/${targetUuid}` : '/app/pos/saldo');
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        const errorMsg = result.message || 'Gagal menyimpan data';
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
        {mode === 'edit' ? 'Edit Akun Saldo' : 'Tambah Akun Saldo'}
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
              placeholder="Contoh: CASH, DANA, BRI"
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
              placeholder="Masukkan nama akun saldo"
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
              <option value="bank">Bank</option>
              <option value="e_wallet">E-Wallet</option>
              <option value="other">Lainnya</option>
            </select>
            {fieldErrors.type && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.type[0]}</div>
            )}
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
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                fieldErrors.sortOrder
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:ring-[#EBC170] focus:border-[#EBC170]'
              }`}
              placeholder={mode === 'create' ? 'Kosongkan = paling akhir' : '0'}
            />
            <p className="mt-1 text-xs text-gray-500">Menentukan urutan tombol metode bayar di halaman Kasir. Bisa juga diatur lewat tombol naik/turun di daftar akun saldo.</p>
            {fieldErrors.sortOrder && (
              <div className="mt-1 text-sm text-red-600">{fieldErrors.sortOrder[0]}</div>
            )}
          </div>

          {mode === 'create' && (
            <div>
              <label htmlFor="opening_balance" className="block text-sm font-medium text-gray-700 mb-2">
                Saldo Awal
              </label>
              <RupiahInput
                id="opening_balance"
                value={formData.opening_balance}
                onChange={(v) => setFormData((prev) => ({ ...prev, opening_balance: v }))}
                hasError={!!fieldErrors.opening_balance}
              />
              {fieldErrors.opening_balance && (
                <div className="mt-1 text-sm text-red-600">{fieldErrors.opening_balance[0]}</div>
              )}
            </div>
          )}

          {mode === 'create' && (
            <>
              <div>
                <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Rekening/Akun (Grup Pertama)
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
                  Nama Pemilik Akun (Grup Pertama)
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
            </>
          )}

          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_payment_method"
                name="is_payment_method"
                checked={formData.is_payment_method}
                onChange={handleInputChange}
                className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170] cursor-pointer"
              />
              <label htmlFor="is_payment_method" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Bisa dipakai sebagai metode bayar
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170] cursor-pointer"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Aktif
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="show_in_shift"
                name="show_in_shift"
                checked={formData.show_in_shift}
                onChange={handleInputChange}
                className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170] cursor-pointer"
              />
              <label htmlFor="show_in_shift" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Tampilkan saat buka/tutup shift kasir
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_bank_agent"
                name="is_bank_agent"
                checked={formData.is_bank_agent}
                onChange={handleInputChange}
                className="w-4 h-4 text-[#EBC170] border-gray-300 rounded focus:ring-[#EBC170] cursor-pointer"
              />
              <label htmlFor="is_bank_agent" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                Bisa dipakai untuk transaksi Agen Bank
              </label>
            </div>
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
            placeholder="Masukkan deskripsi akun saldo"
          />
          {fieldErrors.description && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.description[0]}</div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link href="/app/pos/saldo">
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
