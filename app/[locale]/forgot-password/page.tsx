'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/api/api';

export default function ForgotPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    const response = await apiRequest<{ sent: boolean }>('/api/auth/forgot-password', {
      method: 'POST',
      data: { email },
    });

    if (response.status === 'success') {
      setSubmitted(true);
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

          {!submitted ? (
            <>
              <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#142D52] mb-6 cursor-pointer transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Link>

              <div className="mb-8">
                <div className="w-12 h-12 rounded-full bg-[#142D52]/10 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#142D52]" />
                </div>
                <h1 className="text-3xl font-bold text-[#142D52] mb-3">Lupa Password?</h1>
                <p className="text-gray-600">
                  Masukkan email terdaftar Anda. Kami akan mengirimkan link untuk mengatur ulang password.
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
                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all ${fieldErrors.email ? 'border-red-500' : ''}`}
                    placeholder="nama@email.com"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.email[0]}</p>
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
                  {isLoading ? 'Mengirim...' : 'Kirim Link Atur Ulang'}
                </button>

                <p className="text-center text-sm text-gray-600">
                  Ingat password?{' '}
                  <Link href="/login" className="font-bold text-[#EBC170] hover:text-[#d6af63] transition-colors cursor-pointer">
                    Masuk disini
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#142D52] mb-3">Cek Email Anda</h1>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Kami sudah mengirimkan link untuk mengatur ulang password ke{' '}
                <b className="text-[#142D52]">{email}</b>.
                Buka email Anda dan klik link tersebut.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left text-xs text-amber-700 mb-6">
                Link berlaku 1 jam. Tidak menerima email? Cek folder spam, atau
                ulangi beberapa menit lagi jika ingin mengirim ulang.
              </div>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full py-3 px-4 rounded-lg font-bold text-white transition-all hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: '#142D52' }}
              >
                Kembali ke Login
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
            Jangan Khawatir, <br />
            <span className="text-[#EBC170]">Kami Bantu Pulihkan</span>
          </h2>

          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Dengan link atur ulang yang aman, Anda bisa membuat password baru
            dan kembali mengelola usaha Anda dengan tenang.
          </p>
        </div>
      </div>
    </div>
  );
}
