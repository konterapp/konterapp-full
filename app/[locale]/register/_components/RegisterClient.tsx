'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { apiRequest } from '@/lib/api/api';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.16 7.16 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierIntent = searchParams.get('tier');
  const periodIntent = searchParams.get('period');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [agreed, setAgreed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const refFromUrl = searchParams.get('ref')?.toUpperCase() || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company_name: '',
    referral_code: searchParams.get('ref')?.toUpperCase() || '',
    password: '',
    password_confirmation: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    if (formData.password !== formData.password_confirmation) {
      setFieldErrors({ password_confirmation: ['Konfirmasi password tidak cocok'] });
      setIsLoading(false);
      return;
    }

    if (!agreed) {
      setError('Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi untuk mendaftar.');
      setIsLoading(false);
      return;
    }

    const response = await apiRequest<{ user: { name: string } }>('/api/auth/register', {
      method: 'POST',
      data: formData,
    });

    if (response.status === 'success') {
      setIsRegistered(true);
      setCooldown(60);
      startCooldown();
    } else if (response.errors && Object.keys(response.errors).length > 0) {
      setFieldErrors(response.errors);
    } else {
      setError(response.message || 'Pendaftaran gagal. Silakan coba lagi.');
    }

    setIsLoading(false);
  };

  const startCooldown = () => {
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendVerification = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setResendMessage('');
    try {
      const response = await apiRequest<{ user: { name: string } }>('/api/auth/resend-verification', {
        method: 'POST',
        data: { email: formData.email },
      });
      setResendMessage(response.message || 'Email verifikasi dikirim ulang.');

      if (response.status === 'success') {
        setCooldown(60);
        startCooldown();
      }
    } catch {
      setResendMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Register Form */}
      <div className="w-full lg:w-2/5 bg-white flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-12 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#142D52] mb-3">
              <Link href="/" className="cursor-pointer">KonterApp</Link>
            </h2>
            <p className="text-sm text-gray-600">
              Mulai kelola usaha konter Anda dengan lebih mudah
            </p>
          </div>

          {/* Success / Verifikasi Email */}
          {isRegistered ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#142D52]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Pendaftaran Berhasil!
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Kami telah mengirim email verifikasi ke
              </p>
              <p className="text-sm font-semibold text-[#142D52] mb-3">
                {formData.email}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-left text-sm text-gray-700 mb-6">
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-[#142D52] font-bold mt-0.5">1.</span>
                    Buka email Anda dan klik tombol/link <b>Verifikasi Email</b>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#142D52] font-bold mt-0.5">2.</span>
                    Setelah terverifikasi, Anda bisa login ke akun KonterApp.
                  </li>
                </ul>
                <p className="mt-2 text-xs text-gray-500">
                  Link berlaku 24 jam. Tidak menerima email? Cek folder spam,
                  atau klik tombol di bawah untuk mengirim ulang.
                </p>
              </div>
              {tierIntent && (
                <p className="text-sm text-gray-600 mb-4">
                  Jangan lupa, setelah login Anda bisa mengaktifkan paket{' '}
                  {tierIntent.charAt(0).toUpperCase() + tierIntent.slice(1)}.
                </p>
              )}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={cooldown > 0 || isResending}
                  className="w-full py-3 px-4 rounded-lg font-bold border border-[#142D52] text-[#142D52] transition-all hover:bg-[#142D52] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isResending
                    ? 'Mengirim ulang...'
                    : cooldown > 0
                      ? `Kirim Ulang dalam ${cooldown}s`
                      : 'Kirim Ulang Email Verifikasi'}
                </button>
                {resendMessage && (
                  <p className={`text-xs ${resendMessage.includes('Terkirim') || resendMessage.includes('dikirim') ? 'text-green-600' : 'text-gray-500'}`}>
                    {resendMessage}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const query = new URLSearchParams();
                    if (tierIntent) query.set('tier', tierIntent);
                    if (periodIntent) query.set('period', periodIntent);
                    router.push(query.size > 0 ? `/login?${query.toString()}` : '/login');
                  }}
                  className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: '#142D52' }}
                >
                  Sudah Verifikasi, Lanjut ke Login
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Masih belum bisa masuk? Pastikan email sudah diverifikasi terlebih dahulu.
              </p>
            </div>
          ) : (
          <>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="John Doe"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name[0]}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="johndoe@gmail.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Company Name Input */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Toko/Perusahaan <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent ${fieldErrors.company_name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Toko Berkah"
              />
              <p className="mt-1 text-xs text-gray-400">Perusahaan baru akan dibuat untuk Anda. Kosongkan untuk memakai nama dari nama Anda.</p>
              {fieldErrors.company_name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.company_name[0]}</p>
              )}
            </div>

            {/* Referral Code Input */}
            <div>
              <label htmlFor="referral_code" className="block text-sm font-medium text-gray-700 mb-2">
                Kode Referral {refFromUrl ? '' : <span className="text-gray-400 font-normal">(opsional)</span>}
              </label>
              <input
                type="text"
                id="referral_code"
                value={formData.referral_code}
                onChange={(e) => updateField('referral_code', e.target.value.toUpperCase())}
                readOnly={!!refFromUrl}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent ${refFromUrl ? 'bg-gray-50 cursor-not-allowed text-gray-700' : ''} ${fieldErrors.referral_code ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="ABC123"
              />
              {refFromUrl ? (
                <p className="mt-1 text-xs text-amber-600">Kode referral dari link undangan — tidak dapat diubah.</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">Punya kode referral dari teman? Dapat diskon langganan pertama.</p>
              )}
              {fieldErrors.referral_code && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.referral_code[0]}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="--------"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password[0]}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  id="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={(e) => updateField('password_confirmation', e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent ${fieldErrors.password_confirmation ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="--------"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPasswordConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password_confirmation[0]}</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 cursor-pointer accent-[#142D52]"
              />
              <label htmlFor="agree-terms" className="text-sm text-gray-600 cursor-pointer">
                Saya setuju dengan{' '}
                <Link href="/legal/terms" className="text-[#142D52] font-medium underline" target="_blank">
                  Syarat &amp; Ketentuan
                </Link>{' '}
                dan{' '}
                <Link href="/legal/privacy" className="text-[#142D52] font-medium underline" target="_blank">
                  Kebijakan Privasi
                </Link>{' '}
                KonterApp.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !agreed}
              className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: '#142D52' }}
            >
              {isLoading ? 'Mendaftar...' : 'DAFTAR'}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">atau</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={() => {
                if (refFromUrl) {
                  localStorage.setItem('pending_referral_code', refFromUrl);
                }
                signIn('google', { callbackUrl: '/app' });
              }}
              className="w-full py-3 px-4 rounded-lg font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <GoogleIcon />
              Daftar dengan Google
            </button>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Sudah Punya Akun?{' '}
                <Link href="/login" className="font-semibold text-[#EBC170] hover:text-[#d6af63] cursor-pointer">
                  Masuk disini
                </Link>
              </p>
            </div>
          </form>
          </>
          )}
        </div>
      </div>

      {/* Right Column - Graphics */}
      <div className="hidden lg:flex lg:w-3/5 bg-gray-100 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center px-8">
          <h2 className="text-6xl font-bold text-[#142D52] mb-4">KonterApp</h2>
          <p className="text-lg text-gray-600 max-w-md text-center">
            Aplikasi kasir & pembukuan untuk konter, minimarket, dan toko Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
