'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLogin } from '@/lib/hooks/useLogin';
import { Link } from '@/i18n/navigation';

export default function LoginClient() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    fieldErrors,
    successMessage,
    emailNotVerified,
    resendCooldown,
    resendMessage,
    handleSubmit,
    handleResend,
  } = useLogin();

  return (
    <div className="min-h-screen flex">
      {/* Kolom Kiri - Form Login */}
      <div className="w-full lg:w-2/5 bg-white flex items-center justify-center px-4 sm:px-6 md:px-10 lg:px-12 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto relative w-32 h-32">
              <Image
                src="/images/logo_eventbyid.png"
                alt="Event By Indonesia"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 128px, 128px"
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Selamat Datang di Dashboard EBI
            </h3>
            <p className="text-sm text-gray-600">
              Silahkan masuk akun untuk mengakses dashboard
            </p>
          </div>

          {/* Success Message (e.g. after email verification) */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-5">
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="johndoe@gmail.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
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

            {/* Lupa Password */}
            <div className="flex justify-end -mt-1">
              <Link href="/forgot-password" className="text-sm text-pink-600 hover:text-pink-700 font-semibold">
                Lupa Password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p>{error}</p>
                {emailNotVerified && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="font-semibold text-pink-600 hover:text-pink-700 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer text-sm"
                    >
                      {resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown} detik` : 'Kirim Ulang Email Verifikasi'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Resend Message */}
            {resendMessage && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                {resendMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: '#142D52' }}
            >
              {isLoading ? 'Memproses...' : 'MASUK'}
            </button>

            {/* Register Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Belum Punya Akun?{' '}
                <Link href="/register" className="font-semibold text-pink-600 hover:text-pink-700 cursor-pointer">
                  Daftar disini
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Kolom Kanan - Grafis */}
      <div className="hidden lg:flex lg:w-3/5 bg-gray-100 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <Image
            src="/images/logo_eventbyid.png"
            alt="EBI Logo"
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
