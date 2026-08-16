'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api/api';

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIntent = searchParams.get('plan');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company_name: '',
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
      const isYearlyIntent = planIntent === 'yearly';
      setSuccessMessage(
        isYearlyIntent
          ? 'Pendaftaran berhasil! Silakan login untuk mengaktifkan Paket Tahunan Anda.'
          : response.message || 'Pendaftaran berhasil! Silakan login.'
      );
      setTimeout(() => {
        router.push(isYearlyIntent ? '/login?plan=yearly' : '/login');
      }, 2000);
    } else if (response.errors && Object.keys(response.errors).length > 0) {
      setFieldErrors(response.errors);
    } else {
      setError(response.message || 'Pendaftaran gagal. Silakan coba lagi.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Register Form */}
      <div className="w-full lg:w-2/5 bg-white flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-12 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto relative w-32 h-32">
              <Image
                src="/images/logo_eventbyid.png"
                alt="KonterApp"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 128px, 128px"
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Daftar Akun KonterApp
            </h3>
            <p className="text-sm text-gray-600">
              Mulai kelola usaha konter Anda dengan lebih mudah
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-5">
              {successMessage}
            </div>
          )}

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
        </div>
      </div>

      {/* Right Column - Graphics */}
      <div className="hidden lg:flex lg:w-3/5 bg-gray-100 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <Image
            src="/images/logo_eventbyid.png"
            alt="KonterApp Logo"
            width={400}
            height={400}
            className="w-64 h-auto"
            style={{ width: '256px', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
