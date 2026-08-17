'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Building2, CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/company/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName }),
      });

      const json = await response.json();

      if (response.ok && json.status === 'success') {
        router.push('/app');
        router.refresh();
      } else {
        setError(json.message || 'Gagal membuat perusahaan');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#EBC170]/20 flex items-center justify-center text-[#EBC170]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#142D52]">Lengkapi Setup Anda</h1>
            <p className="text-gray-600 text-sm mt-0.5">Satu langkah lagi sebelum masuk ke KonterApp.</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          {[
            'Perusahaan akan menjadi tempat usaha Anda di KonterApp',
            'Anda menjadi administrator perusahaan ini',
            'Paket Free aktif otomatis dan gratis selamanya setelah perusahaan dibuat',
          ].map((text) => (
            <div key={text} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Perusahaan
            </label>
            <input
              type="text"
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              minLength={2}
              maxLength={255}
              autoFocus
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
              placeholder="Contoh: Konter Berkah Jaya"
            />
            <p className="text-xs text-gray-500 mt-2">
              Nama ini dipakai untuk laporan dan tampilan aplikasi. Bisa diubah nanti.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#142D52]/30 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Memproses...</span>
              </div>
            ) : (
              'Buat Perusahaan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
