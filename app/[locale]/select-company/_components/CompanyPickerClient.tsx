'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { getUser, switchActiveCompany, User } from '@/lib/api/auth';
import { useToast } from '@/components/toast/ToastContainer';
import { Building2, Check, ChevronRight, LogOut } from 'lucide-react';

export default function CompanyPickerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUser();

      if (response.status === 'success' && response.data) {
        setUser(response.data);
        const companies = response.data.companies ?? [];

        // User tanpa perusahaan / cuma satu perusahaan tidak perlu picker
        if (companies.length <= 1) {
          const redirectParam = searchParams.get('redirect');
          router.replace(redirectParam || '/app');
          return;
        }
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSelect = async (uuid: string) => {
    if (isSwitching) return;
    setIsSwitching(uuid);
    try {
      const response = await switchActiveCompany(uuid);

      if (response.status === 'success') {
        const companyName = user?.companies?.find((c) => c.uuid === uuid)?.name;
        toast.success(companyName ? `Berhasil masuk ke ${companyName}` : 'Perusahaan aktif berhasil diganti');
        const redirectParam = searchParams.get('redirect');
        router.push(redirectParam || '/app');
      } else {
        toast.error(response.message || 'Gagal berpindah perusahaan');
      }
    } catch {
      toast.error('Terjadi kesalahan, silakan coba lagi');
    } finally {
      setIsSwitching(null);
    }
  };

  const handleLogout = async () => {
    try {
      const { logout } = await import('@/lib/api/auth');
      await logout();
    } finally {
      router.push('/login');
    }
  };

  const companies = user?.companies ?? [];
  const activeUuid = user?.active_company_uuid;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#142D52]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBC170]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#142D52] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#EBC170]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#EBC170]/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">KonterApp</h1>
          <p className="text-gray-300">
            Halo, <span className="font-semibold text-white">{user?.name}</span>. Pilih perusahaan yang ingin Anda kelola.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Pilih Perusahaan
          </p>

          <div className="space-y-3">
            {companies.map((company) => {
              const isActive = company.uuid === activeUuid;
              const isCurrent = isSwitching === company.uuid;

              return (
                <button
                  key={company.uuid}
                  onClick={() => handleSelect(company.uuid)}
                  disabled={isSwitching !== null}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    isActive
                      ? 'border-[#EBC170] bg-[#EBC170]/10'
                      : 'border-gray-200 bg-white hover:border-[#142D52]/40 hover:bg-gray-50'
                  } ${isSwitching !== null ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                      isActive ? 'bg-[#EBC170] text-gray-900' : 'bg-[#142D52]/10 text-[#142D52]'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{company.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{company.code}</p>
                  </div>

                  {isCurrent ? (
                    <div className="w-5 h-5 border-2 border-[#142D52]/30 border-t-[#142D52] rounded-full animate-spin shrink-0"></div>
                  ) : isActive ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-[#142D52] shrink-0">
                      <Check className="w-4 h-4" />
                      Aktif
                    </span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/logout"
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Link>
        </div>
      </div>
    </div>
  );
}
