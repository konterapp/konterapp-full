'use client';

import { Link } from '@/i18n/navigation';
import { ChevronRight, ShieldCheck, Building2, ReceiptText, Ticket, Users } from 'lucide-react';
import { useAdministrator } from '../_context/AdministratorContext';

// Pintasan ke menu yang memang sudah ada di sidebar. Di HP sidebar tersembunyi
// di balik hamburger, jadi tile ini bikin menu utama tetap satu tap dari
// dashboard.
const shortcuts = [
  {
    label: 'Perusahaan',
    description: 'Kelola tenant terdaftar',
    href: '/administrator/companies',
    icon: Building2,
  },
  {
    label: 'Billing',
    description: 'Langganan & invoice',
    href: '/administrator/billing',
    icon: ReceiptText,
  },
  {
    label: 'Kupon',
    description: 'Kode promo & diskon',
    href: '/administrator/coupons',
    icon: Ticket,
  },
  {
    label: 'User',
    description: 'Akun pengguna tenant',
    href: '/administrator/users',
    icon: Users,
  },
];

export default function AdministratorDashboardPage() {
  const { administrator, isLoading } = useAdministrator();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header -- kartu bergradient biar bagian atas layar HP tidak terasa
          kosong & langsung terbaca sebagai area administrator. */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1E3A] to-[#142D52] p-5 text-white shadow-lg sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#EBC170]/20 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EBC170] text-[#0B1E3A] shadow-lg shadow-[#EBC170]/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-[#EBC170]">
              Platform Administrator
            </p>
            <h1 className="mt-1 truncate text-xl font-bold sm:text-2xl">
              {isLoading ? 'Memuat...' : `Halo, ${administrator?.name ?? 'Administrator'}`}
            </h1>
            {administrator?.email && (
              <p className="mt-1 truncate text-sm text-gray-300">{administrator.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pintasan menu */}
      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-gray-500">Menu</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#EBC170] hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1E3A]/5 text-[#0B1E3A] transition-colors group-hover:bg-[#EBC170]/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{item.label}</p>
                  <p className="truncate text-sm text-gray-500">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-[#EBC170]" />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-5 text-center">
        <p className="text-sm text-gray-500">
          Ringkasan statistik platform akan ditampilkan di sini.
        </p>
      </div>
    </div>
  );
}
