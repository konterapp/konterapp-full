'use client';

import { useRouter } from '@/i18n/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';
import { logoutAdministrator } from '@/lib/api/administrator/auth';
import { useAdministrator } from '../_context/AdministratorContext';

export default function AdministratorNavbar() {
  const router = useRouter();
  const { administrator } = useAdministrator();

  const handleLogout = async () => {
    await logoutAdministrator();
    router.push('/administrator/login');
  };

  return (
    <header className="h-16 bg-[#0B1E3A] border-b border-white/10 flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-white font-bold">
        <ShieldCheck className="w-5 h-5 text-[#EBC170]" />
        <span>KonterApp Administrator</span>
      </div>

      <div className="flex items-center gap-4">
        {administrator && (
          <span className="text-sm text-gray-300">{administrator.name}</span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </header>
  );
}
