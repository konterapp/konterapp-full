'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, XCircle, MailCheck, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'empty'>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('empty');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const json = await response.json();

        if (response.ok && json.status === 'success') {
          setStatus('success');
          setMessage(json.message);
        } else {
          setStatus('error');
          setMessage(json.message || 'Verifikasi gagal');
        }
      } catch {
        setStatus('error');
        setMessage('Terjadi kesalahan saat verifikasi');
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    setResendMessage('');
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchParams.get('email') ?? '' }),
      });
      const json = await response.json();
      setResendMessage(json.message || 'Gagal kirim ulang');
    } catch {
      setResendMessage('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 text-center space-y-5">
        {status === 'loading' && (
          <>
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#142D52] rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Memverifikasi email Anda...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#142D52]">Email Terverifikasi!</h1>
            <p className="text-gray-600 text-sm">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] transition-colors cursor-pointer"
            >
              Masuk ke Akun Anda
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#142D52]">Verifikasi Gagal</h1>
            <p className="text-gray-600 text-sm">{message}</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold text-[#142D52] bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
            </button>
            {resendMessage && <p className="text-xs text-gray-500">{resendMessage}</p>}
          </>
        )}

        {status === 'empty' && (
          <>
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <MailCheck className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#142D52]">Token Tidak Ditemukan</h1>
            <p className="text-gray-600 text-sm">
              Buka email Anda dan klik tombol verifikasi, atau minta kirim ulang dari halaman login.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] transition-colors cursor-pointer"
            >
              Kembali ke Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#142D52] rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
