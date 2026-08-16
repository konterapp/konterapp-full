'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ShieldAlert } from 'lucide-react';
import { useUser } from '../_context/UserContext';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const isBillingRoute = /\/app\/billing(\/|$)/.test(pathname || '');

  if (isLoading || isBillingRoute) return <>{children}</>;

  if (user?.subscription?.status !== 'expired') return <>{children}</>;

  return (
    <div className="relative flex flex-col items-center justify-center py-20 px-4 overflow-hidden bg-white rounded-xl border border-gray-200">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-[#142D52]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <div className="mb-6 w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>

        <h2 className="text-lg font-semibold text-gray-800">
          Langganan Anda Sudah Berakhir
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Masa aktif paket perusahaan Anda telah habis. Perpanjang langganan untuk melanjutkan akses ke KonterApp.
        </p>

        <Link
          href="/app/billing"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#142D52] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1a3a6a] cursor-pointer"
        >
          Perpanjang Langganan
        </Link>
      </div>
    </div>
  );
}
