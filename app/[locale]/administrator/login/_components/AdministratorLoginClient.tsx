'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { loginAdministrator } from '@/lib/api/administrator/auth';
import { Eye, EyeOff, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function AdministratorLoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginAdministrator(email, password);

      if (response.status === 'success' && response.data) {
        const redirectParam = searchParams.get('redirect');
        router.push(redirectParam || '/administrator');
      } else {
        setError(response.message || 'Email atau password salah');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-gradient-to-b from-[#0B1E3A] via-[#0E2545] to-[#142D52] px-5 py-8 sm:px-6">
      {/* Dekorasi glow -- pola yang sama dgn panel banner di login user
          (LoginClient.tsx), biar latar gelapnya tidak terasa datar/kosong. */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#EBC170]/20 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#EBC170]/10 blur-3xl sm:h-80 sm:w-80" />

      {/* Konten disebar ke seluruh tinggi layar (header - form - footer), bukan
          digumpalkan di tengah, supaya di layar HP yang tinggi tidak menyisakan
          ruang mati besar di atas & bawah. */}
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EBC170] to-[#d6af63] text-[#0B1E3A] shadow-lg shadow-[#EBC170]/25">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">KonterApp Administrator</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            Akses khusus untuk administrator platform.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6"
        >
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-[#0B1E3A]/70 py-3.5 pl-12 pr-4 text-base text-white transition-all placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-[#0B1E3A]/70 py-3.5 pl-12 pr-12 text-base text-white transition-all placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#EBC170]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 flex h-full w-12 cursor-pointer items-center justify-center text-gray-400 transition-colors hover:text-gray-200"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer rounded-xl bg-[#EBC170] px-4 py-3.5 font-bold text-[#0B1E3A] shadow-lg shadow-[#EBC170]/20 transition-all hover:bg-[#d6af63] focus:ring-4 focus:ring-[#EBC170]/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0B1E3A]/30 border-t-[#0B1E3A]" />
                Memproses...
              </span>
            ) : (
              'Masuk sebagai Administrator'
            )}
          </button>
        </form>
      </div>

      <p className="relative pb-[env(safe-area-inset-bottom)] text-center text-xs text-gray-500">
        Halaman ini khusus administrator platform KonterApp.
      </p>
    </div>
  );
}
