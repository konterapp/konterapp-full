'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useUser } from '../_context/UserContext';
import { getPermissionByPath } from '@/lib/routes';

export default function PermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { permissions, isLoading } = useUser();

  const requiredPermission = getPermissionByPath(pathname);

  if (isLoading) return null;

  if (!requiredPermission) return <>{children}</>;

  if (permissions.includes(requiredPermission)) return <>{children}</>;

  return (
    <div className="relative flex flex-col items-center justify-center py-20 px-4 overflow-hidden bg-white rounded-xl border border-gray-200">
      {/* Background decorative */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-red-400/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-[#142D52]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Shield illustration */}
        <div className="mb-6">
          <svg
            width="120"
            height="140"
            viewBox="0 0 120 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            <path
              d="M60 10L15 30V65C15 95 35 122 60 130C85 122 105 95 105 65V30L60 10Z"
              fill="#fef2f2"
              stroke="#fca5a5"
              strokeWidth="2"
            />
            <path
              d="M60 20L25 36V65C25 90 42 113 60 120C78 113 95 90 95 65V36L60 20Z"
              fill="white"
              stroke="#fecaca"
              strokeWidth="1"
            />
            <line x1="45" y1="60" x2="75" y2="90" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            <line x1="75" y1="60" x2="45" y2="90" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Error code */}
        <p className="text-6xl font-bold tracking-tight text-gray-900">
          4<span className="text-red-500">0</span>3
        </p>

        <h2 className="mt-3 text-lg font-semibold text-gray-800">
          Akses Ditolak
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
          Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika ini adalah kesalahan.
        </p>

        <Link
          href="/app"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#142D52] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1a3a6a]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
