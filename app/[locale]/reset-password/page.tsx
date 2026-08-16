'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/navigation';
import { CheckCircle2, XCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '@/lib/api/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'form' | 'success' | 'error'>(() =>
    token ? 'form' : 'error'
  );
  const [message, setMessage] = useState(() =>
    token ? '' : 'Link atur ulang tidak valid. Minta ulang dari halaman login.'
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    if (password !== passwordConfirmation) {
      setFieldErrors({ password_confirmation: ['Konfirmasi password tidak cocok'] });
      setIsLoading(false);
      return;
    }

    const response = await apiRequest<{ reset: boolean }>('/api/auth/reset-password', {
      method: 'POST',
      data: { token, password, password_confirmation: passwordConfirmation },
    });

    if (response.status === 'success') {
      setStatus('success');
      setMessage(response.message || 'Password berhasil diatur ulang.');
    } else if (response.errors && Object.keys(response.errors).length > 0) {
      setFieldErrors(response.errors);
    } else {
      setError(response.message || 'Terjadi kesalahan. Silakan coba lagi.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Column - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-16 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="text-2xl font-bold text-[#142D52]">KonterApp</Link>
          </div>

          {status === 'form' && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-full bg-[#142D52]/10 flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6 text-[#142D52]" />
                </div>
                <h1 className="text-3xl font-bold text-[#142D52] mb-3">Buat Password Baru</h1>
                <p className="text-gray-600">
                  Masukkan password baru untuk akun Anda. Minimal 6 karakter.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all ${fieldErrors.password ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      id="password_confirmation"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all ${fieldErrors.password_confirmation ? 'border-red-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                      aria-label={showPasswordConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password_confirmation[0]}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  style={{ backgroundColor: '#142D52' }}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </form>
            </>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#142D52] mb-3">Password Diperbarui!</h1>
              <p className="text-gray-600 text-sm mb-6">{message}</p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: '#142D52' }}
              >
                Masuk ke Akun Anda
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#142D52] mb-3">Link Tidak Valid</h1>
              <p className="text-gray-600 text-sm mb-6">{message}</p>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: '#142D52' }}
              >
                Minta Link Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#142D52] relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EBC170]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#EBC170]/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-lg">
          <Link href="/" className="text-3xl font-bold text-white mb-12 block">KonterApp</Link>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Amankan Akun Anda, <br />
            <span className="text-[#EBC170]">Lanjutkan Usaha Anda</span>
          </h2>

          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Password baru yang kuat membantu melindungi data usaha Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#142D52]"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
