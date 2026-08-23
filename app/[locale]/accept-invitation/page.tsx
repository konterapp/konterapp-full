'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, XCircle, MailCheck } from 'lucide-react';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'empty'>(
    token ? 'loading' : 'empty'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const accept = async () => {
      try {
        const response = await fetch('/api/auth/accept-invitation', {
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
          setMessage(json.message || 'Menerima undangan gagal');
        }
      } catch {
        setStatus('error');
        setMessage('Terjadi kesalahan saat menerima undangan');
      }
    };

    accept();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-8 text-center space-y-5">
        {status === 'loading' && (
          <>
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#142D52] rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Memproses undangan Anda...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#142D52]">Undangan Diterima!</h1>
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
            <h1 className="text-2xl font-bold text-[#142D52]">Gagal Menerima Undangan</h1>
            <p className="text-gray-600 text-sm">{message}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-lg font-bold text-white bg-[#142D52] hover:bg-[#0B1E3A] transition-colors cursor-pointer"
            >
              Kembali ke Login
            </Link>
          </>
        )}

        {status === 'empty' && (
          <>
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <MailCheck className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#142D52]">Token Tidak Ditemukan</h1>
            <p className="text-gray-600 text-sm">
              Buka email undangan Anda dan klik tombol &quot;Terima Undangan&quot;.
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

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#142D52] rounded-full animate-spin" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
