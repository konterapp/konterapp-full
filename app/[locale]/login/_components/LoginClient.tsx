'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { login } from '@/lib/api/auth';
import { CheckCircle2, Eye, EyeOff, Zap } from 'lucide-react';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recaptchaChecked) {
      setError('Harap verifikasi reCAPTCHA terlebih dahulu');
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(email, password);

      if (response.status === 'success' && response.data) {
        // Token is stored in cookie automatically by NextAuth

        const userRoles = response.data.user.roles || [];
        const isAdmin = userRoles.includes('admin') || userRoles.includes('super-admin');

        const redirectParam = searchParams.get('redirect');

        if (redirectParam) {
          router.push(redirectParam);
        } else {
          if (isAdmin) {
            router.push('/app');
          } else {
            router.push('/user');
          }
        }
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
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-16 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="text-2xl font-bold text-[#142D52]">KonterApp</Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#142D52] mb-3">Selamat Datang Kembali</h1>
            <p className="text-gray-600">
              Masuk ke akun Anda untuk mulai bertransaksi dan kelola pembukuan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-[#142D52] hover:text-[#0B1E3A]">
                  Lupa Password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* reCAPTCHA Placeholder */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-center cursor-pointer select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={recaptchaChecked}
                    onChange={(e) => setRecaptchaChecked(e.target.checked)}
                    className="peer h-6 w-6 cursor-pointer appearance-none rounded border border-gray-300 transition-all checked:border-[#142D52] checked:bg-[#142D52]"
                  />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-600">Saya bukan robot (Demo)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#142D52]/30"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                'Masuk Sekarang'
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link href="/register" className="font-bold text-[#EBC170] hover:text-[#d6af63] transition-colors">
                Daftar Gratis
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Column - Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#142D52] relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EBC170]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#EBC170]/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-lg">
          <Link href="/" className="text-3xl font-bold text-white mb-12 block">KonterApp</Link>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Solusi Pintar untuk <br />
            <span className="text-[#EBC170]">Usaha Anda</span>
          </h2>

          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Bergabunglah dengan ribuan pengusaha konter dan kelontong lainnya. Nikmati kemudahan transaksi PPOB dan manajemen kasir dalam satu aplikasi.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-[#EBC170]/20 flex items-center justify-center text-[#EBC170]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Transaksi Kilat</h4>
                <p className="text-xs text-gray-400">Proses detik-an langsung sukses</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-[#EBC170]/20 flex items-center justify-center text-[#EBC170]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Laporan Lengkap</h4>
                <p className="text-xs text-gray-400">Pantau omzet dan laba real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
