'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ChevronDown, Menu, X, Bell, Settings, Building2, Check, Headset } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { switchActiveCompany } from '@/lib/api/auth';
import { useToast } from '@/components/toast/ToastContainer';
import { useUser } from '../_context/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import ImpersonateButton from './ImpersonateButton';
import { SUPPORT_WHATSAPP_URL } from '@/lib/support';

const Navbar = () => {
  const { permissions } = usePermissions();
  const { isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed } = useSidebar();
  const toast = useToast();
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const { user, activeCompanyUuid } = useUser();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCompanySwitch = async (uuid: string) => {
    if (uuid === activeCompanyUuid) {
      setIsCompanyDropdownOpen(false);
      return;
    }
    setIsSwitchingCompany(true);
    try {
      const response = await switchActiveCompany(uuid);
      if (response.status === 'success') {
        toast.success('Perusahaan aktif berhasil diganti');
        setIsCompanyDropdownOpen(false);
        window.location.reload();
      } else {
        toast.error(response.message || 'Gagal mengganti perusahaan');
      }
    } catch {
      toast.error('Terjadi kesalahan, silakan coba lagi');
    } finally {
      setIsSwitchingCompany(false);
    }
  };

  const activeCompany = user?.companies?.length
    ? (user.companies.find((company) => company.uuid === activeCompanyUuid) ?? user.companies[0])
    : null;

  return (
    <nav
      className="sticky top-0 z-30 h-14 flex items-center justify-between px-3 lg:px-5 shadow-sm border-b border-gray-100"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors mr-2 cursor-pointer"
      >
        {isMobileOpen ? <X className="w-[18px] h-[18px] text-gray-700" /> : <Menu className="w-[18px] h-[18px] text-gray-700" />}
      </button>

      {/* Tombol buka sidebar (desktop, hanya saat sidebar diciutkan).
          Dulu bersarang di dalam blok search; tetap dipertahankan saat fitur
          search navbar dihapus. */}
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors mr-2 cursor-pointer"
          title="Buka sidebar"
        >
          <Menu className="w-[18px] h-[18px] text-gray-700" />
        </button>
      )}

      {/* Pendorong: sisi kanan menempel ke tepi kanan di desktop */}
      <div className="hidden sm:block flex-1" />

      {/* Right Section.
          Di mobile blok ini yang memegang sisa lebar (flex-1 + min-w-0), supaya
          pemendekan terjadi di nama perusahaan -- bukan mendorong tombol aksi
          (impersonate & avatar) keluar layar seperti sebelumnya. */}
      <div className="flex flex-1 sm:flex-none min-w-0 items-center justify-end gap-1 sm:gap-1.5 lg:gap-3">
        {/* Perusahaan Aktif + Company Switcher */}
        <div ref={companyDropdownRef} className="relative min-w-0 flex-1 sm:flex-none">
          <button
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            disabled={isSwitchingCompany}
            className={`flex w-full sm:w-auto items-center gap-1.5 pl-1.5 pr-2 sm:pl-2 sm:pr-2.5 py-1 rounded-lg border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:max-w-[16rem] transition-colors cursor-pointer ${isSwitchingCompany ? 'opacity-60' : 'hover:border-gray-300'}`}
            title={activeCompany ? `${activeCompany.name} (${activeCompany.code})` : 'Perusahaan aktif belum tersedia'}
          >
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-[#142D52]/10 text-[#142D52] shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-xs sm:text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {activeCompany?.name || 'Perusahaan tidak tersedia'}
              </p>
              {/* Label bantu disembunyikan di mobile: lebar navbar sudah sempit
                  dan chevron sendiri sudah menandakan pill ini bisa diklik. */}
              {user?.companies && user.companies.length > 1 && (
                <p className="hidden sm:block text-[10px] text-gray-400 leading-tight">Ganti perusahaan</p>
              )}
            </div>
            {user?.companies && user.companies.length > 1 && (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            )}
          </button>

          {isCompanyDropdownOpen && user?.companies && user.companies.length > 1 && (
            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Pilih Perusahaan
              </p>
              {user.companies.map((company) => {
                const isActive = company.uuid === activeCompanyUuid;
                return (
                  <button
                    key={company.uuid}
                    onClick={() => handleCompanySwitch(company.uuid)}
                    disabled={isSwitchingCompany}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors cursor-pointer ${
                      isSwitchingCompany ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                        isActive ? 'bg-[#EBC170]/20 text-[#B18B3B]' : 'bg-[#142D52]/10 text-[#142D52]'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                        {company.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{company.code}</p>
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-xs font-medium text-[#142D52] shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 mx-1.5 hidden md:block shrink-0"></div>

        {/* Customer Service / Support */}
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-emerald-600 cursor-pointer"
          title="Hubungi Customer Service"
          aria-label="Hubungi Customer Service via WhatsApp"
        >
          <Headset className="w-[18px] h-[18px]" />
        </a>

        {/* Notifications */}
        <button className="relative shrink-0 hidden sm:block p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-[#142D52] cursor-pointer">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Settings (Profil Perusahaan) */}
        {permissions.includes('company.update') && (
          <Link
            href="/app/company"
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-[#142D52] cursor-pointer hidden md:block"
            title="Profil Perusahaan"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        )}

        {/* Stop Impersonating Button */}
        <ImpersonateButton />

        {/* User Profile */}
        <Link
          href="/app/profile"
          className="flex shrink-0 items-center gap-2 lg:gap-2.5 pl-2 lg:pl-3 border-l border-gray-100 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="text-right hidden md:block">
            <p className="text-[13px] font-bold text-[#142D52] leading-none">{user?.name || 'Guest User'}</p>
            <p className="text-xs text-gray-500 mt-1">{user?.email || 'guest@konterapp.id'}</p>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-gray-100 ring-2 ring-transparent group-hover:ring-[#EBC170] transition-all">
            <Image
              src={
                user?.name
                  ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=142D52&color=fff`
                  : 'https://ui-avatars.com/api/?name=Guest&background=142D52&color=fff'
              }
              alt="User Avatar"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
