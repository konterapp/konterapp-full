'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { login, resendVerification } from '@/lib/api/auth';
import { signIn } from 'next-auth/react';
import { CheckCircle2, Eye, EyeOff, Zap, RefreshCw } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.16 7.16 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recaptchaChecked) {
      setError('Harap verifikasi reCAPTCHA terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setIsEmailUnverified(false);
    setResendMessage('');

    try {
      const response = await login(email, password);

      if (response.status === 'success' && response.data) {
        // Token is stored in cookie automatically by NextAuth

        const redirectParam = searchParams.get('redirect');
        const companies = response.data.user.companies ?? [];

        // Kalau user punya lebih dari satu perusahaan, minta pilih dulu
        if (companies.length > 1) {
          const query = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';
          router.push(`/select-company${query}`);
          return;
        }

        // Intent pilih paket berbayar dari landing → langsung ke halaman upgrade
        if (!redirectParam) {
          const intentTier = searchParams.get('tier');
          if (intentTier && intentTier !== 'free') {
            const query = new URLSearchParams();
            query.set('tier', intentTier);
            const period = searchParams.get('period');
            if (period === 'monthly' || period === 'yearly') query.set('period', period);
            router.push(`/app/billing/upgrade?${query.toString()}`);
            return;
          }
        }

        // Semua akun dari tabel users (/login) masuk ke area app (/app)
        router.push(redirectParam || '/app');
      } else {
        setError(response.message || 'Email atau password salah');
        const errorCode = (response.errors as Record<string, string[]> | undefined)?.error_code?.[0];
        setIsEmailUnverified(errorCode === 'EMAIL_NOT_VERIFIED');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage('');
    try {
      const response = await resendVerification(email);
      setResendMessage(response.message || 'Email verifikasi dikirim');
    } catch {
      setResendMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsResending(false);
    }
  };

  // min-h-dvh (bukan min-h-screen/100vh): 100vh di browser HP tidak menghitung
  // address bar, jadi tinggi halaman meleset & bagian bawah bisa tertutup.
  return (
    <div className="min-h-dvh flex bg-[#142D52] lg:bg-white">
      {/* Left Column - Login Form */}
      <div className="flex w-full flex-col lg:w-1/2 lg:items-center lg:justify-center lg:px-16 lg:py-12">
        {/* Header brand khusus mobile. Panel banner navy di kanan itu
            `hidden lg:flex`, jadi tanpa ini pengguna HP membuka halaman
            berupa formulir putih polos tanpa identitas brand sama sekali. */}
        <div className="relative overflow-hidden px-5 pb-16 pt-7 text-white lg:hidden">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#EBC170]/20 blur-3xl" />
          <div className="relative">
            <Link href="/" className="text-xl font-bold text-white">KonterApp</Link>
            <h1 className="mt-5 text-2xl font-bold leading-tight">Selamat Datang Kembali</h1>
            <p className="mt-1.5 text-sm leading-snug text-gray-300">
              Masuk untuk mulai bertransaksi dan kelola pembukuan.
            </p>
          </div>
        </div>

        {/* Formulir: di HP tampil sebagai sheet putih yang naik menimpa header
            navy; di desktop kembali jadi kolom biasa tanpa sheet. */}
        <div className="relative z-10 -mt-10 flex-1 rounded-t-3xl bg-white px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8 shadow-[0_-8px_24px_rgba(11,30,58,0.15)] lg:mt-0 lg:flex-none lg:rounded-none lg:p-0 lg:shadow-none">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 hidden lg:block">
            <h1 className="text-3xl font-bold text-[#142D52] mb-3">Selamat Datang Kembali</h1>
            <p className="text-gray-600">
              Masuk ke akun Anda untuk mulai bertransaksi dan kelola pembukuan.
            </p>
          </div>

          {/* space-y lebih rapat di HP: dgn header + 2 field + captcha + 2
              tombol, jarak 24px bikin tombol "Masuk Sekarang" terdorong ke
              luar layar. */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              {/* text-base: cegah Safari iOS auto-zoom saat input difokus.
                  inputMode/autoComplete: keyboard email & isi otomatis dari
                  password manager di HP. */}
              <input
                type="email"
                id="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-base bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-[#142D52] hover:text-[#0B1E3A] cursor-pointer">
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 text-base bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#142D52] focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                {/* Area tap dibuat setinggi input & selebar 48px -- sebelumnya
                    hanya seluas ikon (~20px), terlalu kecil untuk jari. */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-gray-500 hover:text-gray-700 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {isEmailUnverified && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending || !email}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-[#142D52] bg-white border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
                </button>
                {resendMessage && (
                  <p className="text-xs text-gray-500 text-center">{resendMessage}</p>
                )}
              </div>
            )}

            {/* reCAPTCHA Placeholder */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <label className="flex items-center cursor-pointer select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={recaptchaChecked}
                    onChange={(e) => setRecaptchaChecked(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 transition-all checked:border-[#142D52] checked:bg-[#142D52]"
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
              className="w-full py-3.5 px-4 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] focus:ring-4 focus:ring-[#142D52]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-[#142D52]/30"
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

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">atau</span>
              </div>
            </div>

                        <button
              type="button"
              onClick={() => {
                if (refCode) {
                  localStorage.setItem('pending_referral_code', refCode.toUpperCase());
                }
                signIn('google', { callbackUrl: '/app' });
              }}
              className="w-full py-3.5 px-4 rounded-lg font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <GoogleIcon />
              Masuk dengan Google
            </button>

            <p className="text-center text-sm text-gray-600">
              Belum punya akun?{' '}
              {/* Emas #EBC170 di atas putih kontrasnya ~1.9:1 -- praktis tak
                  terbaca di HP. Disamakan dgn link "Lupa Password?". */}
              <Link href="/register" className="font-bold text-[#142D52] hover:text-[#0B1E3A] underline underline-offset-2 transition-colors">
                Daftar Gratis
              </Link>
            </p>
          </form>
        </div>
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
