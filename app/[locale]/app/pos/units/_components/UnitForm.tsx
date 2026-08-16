'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { Save, X } from 'lucide-react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/toast/ToastContainer';

interface UnitFormData {
  name: string;
  description: string;
}

interface UnitFormProps {
  unitId?: string;
  mode: 'create' | 'edit';
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

export default function UnitForm({ unitId, mode }: UnitFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(mode === 'edit');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<UnitFormData>({
    name: '',
    description: '',
  });

  const fetchUnit = useCallback(async () => {
    if (!unitId) return;

    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/app/pos/units/${unitId}`);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setFormData({
          name: result.data.name,
          description: result.data.description || '',
        });
      } else {
        setError(result.message || 'Gagal memuat data satuan');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingData(false);
    }
  }, [unitId]);

  useEffect(() => {
    if (mode === 'edit' && unitId) {
      fetchUnit();
    }
  }, [mode, unitId, fetchUnit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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
    if (isLoading) return;
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const url = mode === 'edit' && unitId ? `/api/app/pos/units/${unitId}` : '/api/app/pos/units';
      const method = mode === 'edit' && unitId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });
      const result = await response.json();

      if (result.status === 'success') {
        const successMsg = mode === 'edit' ? 'Satuan berhasil diperbarui' : 'Satuan berhasil ditambahkan';
        toast.success(successMsg);
        router.push('/app/pos/units');
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        const errorMsg = result.message || `Gagal ${mode === 'edit' ? 'mengubah' : 'menambah'} satuan`;
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
        {mode === 'edit' ? 'Edit Satuan Produk' : 'Tambah Satuan Produk Baru'}
      </h1>

      {error && (
        <Alert variant="error" message={error} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nama Satuan <span className="text-red-500">*</span>
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
            placeholder="Contoh: pcs, box, pack"
          />
          {fieldErrors.name && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</div>
          )}
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
            placeholder="Masukkan deskripsi satuan (opsional)"
          />
          {fieldErrors.description && (
            <div className="mt-1 text-sm text-red-600">{fieldErrors.description[0]}</div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Link href="/app/pos/units">
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
