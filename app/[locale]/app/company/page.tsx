'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Save } from 'lucide-react';
import { getTenantCompany, updateTenantCompany, TenantCompany } from '@/lib/api/app/company';
import { useUser } from '@/app/[locale]/app/_context/UserContext';
import { switchActiveCompany } from '@/lib/api/auth';
import { useToast } from '@/components/toast/ToastContainer';

export default function CompanySettingsPage() {
  const toast = useToast();
  const { activeCompanyUuid } = useUser();
  const [company, setCompany] = useState<TenantCompany | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCompany = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getTenantCompany();

      if (response.status === 'success' && response.data) {
        setCompany(response.data);
        setName(response.data.name);
      } else {
        setError(response.message || 'Gagal memuat data perusahaan');
      }
    } catch {
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsSaving(true);
    try {
      const response = await updateTenantCompany({ name });

      if (response.status === 'success') {
        // Refresh session supaya nama perusahaan baru ikut ke token &
        // UI (switcher perusahaan, dsb) tanpa perlu logout.
        if (activeCompanyUuid) {
          await switchActiveCompany(activeCompanyUuid);
        }
        if (response.data) {
          setCompany(response.data);
        }
        toast.success('Perusahaan berhasil diperbarui');
      } else {
        setError(response.message || 'Gagal memperbarui perusahaan');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#142D52]">Pengaturan Perusahaan</h1>
        <p className="text-gray-600 mt-1">Ubah identitas perusahaan yang dipakai di aplikasi dan laporan.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-[#142D52]/5 flex items-center justify-center text-[#142D52]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{company?.name}</h2>
            <p className="text-xs text-gray-500 font-mono">{company?.code}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Perusahaan
            </label>
            <input
              type="text"
              id="company_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={255}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kode Perusahaan</label>
            <input
              type="text"
              value={company?.code ?? ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-mono cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-2">
              Kode perusahaan bersifat tetap dan dikelola oleh tim KonterApp.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving || name.trim() === company?.name}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  );
}
