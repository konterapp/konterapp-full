'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Search, ChevronRight, ChevronDown, Menu, X, Bell, Settings, Building2, Check, Headset } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { switchActiveCompany } from '@/lib/api/auth';
import { useToast } from '@/components/toast/ToastContainer';
import { allMenuItems } from '../_constants/menuItems';
import { useUser } from '../_context/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import ImpersonateButton from './ImpersonateButton';
import { SUPPORT_WHATSAPP_URL } from '@/lib/support';

// AdminMenu translations (id)
const menuTranslations: Record<string, string> = {
  "Dashboard": "Dashboard",
  "Penjualan": "Penjualan",
  "Produk": "Produk",
  "Kategori": "Kategori",
  "Supplier": "Supplier",
  "Pembelian": "Pembelian",
  "Stok On-Hand": "Stok On-Hand",
  "Semua Laporan": "Semua Laporan",
  "Metode Pembayaran": "Metode Pembayaran",
  "Cabang/Lokasi": "Cabang/Lokasi",
  "Agen Bank": "Agen Bank",
  "Server Pulsa/PPOB": "Server Pulsa/PPOB",
  "Jenis Transaksi PPOB": "Jenis Transaksi PPOB",
  "User": "User",
  "Role": "Role",
  "Shift Kasir": "Shift Kasir",
  "Cek Harga": "Cek Harga",
  "Satuan": "Satuan",
  "Pelanggan": "Pelanggan",
  "Printer": "Printer",
  "Mutasi Stok": "Mutasi Stok",
  "Stok Opname": "Stok Opname",
  "Piutang": "Piutang",
  "Hutang": "Hutang",
  "Accounting": "Accounting",
  "Audit Log": "Audit Log",
  "Logout": "Keluar",
};

const tMenu = (key: string): string => menuTranslations[key] || key;

const Navbar = () => {
  const { permissions } = usePermissions();
  const { isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed } = useSidebar();
  const toast = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const { user, activeCompanyUuid } = useUser();

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [isMobileSearchOpen]);

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

  // Filter search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const results: { label: string; href: string; icon: React.ReactNode; breadcrumb?: string }[] = [];

    allMenuItems.forEach(item => {
      // 1. Check parent permission
      if (item.permission && !permissions.includes(item.permission)) return;

      // 2. Check match on Parent Label (both original and translated)
      const translatedParentLabel = tMenu(item.label);
      const parentMatches = item.label.toLowerCase().includes(query) || translatedParentLabel.toLowerCase().includes(query);

      if (item.submenu) {
        const subitemsToAdd = item.submenu.filter(sub => {
          if (sub.permission && !permissions.includes(sub.permission)) return false;
          const translatedSubLabel = tMenu(sub.label);
          return parentMatches || sub.label.toLowerCase().includes(query) || translatedSubLabel.toLowerCase().includes(query);
        });

        subitemsToAdd.forEach(sub => {
          results.push({
            label: tMenu(sub.label),
            href: sub.href,
            icon: sub.icon || item.icon,
            breadcrumb: translatedParentLabel
          });
        });
      } else {
        if (parentMatches && item.href) {
          results.push({
            label: translatedParentLabel,
            href: item.href,
            icon: item.icon
          });
        }
      }
    });

    return results;
  }, [searchQuery, permissions]);

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

      {/* Search Bar - Desktop */}
      <div className="hidden sm:flex flex-1 max-w-xl mr-2 lg:mr-6 items-center">
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
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari menu..."
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-transparent"
            onFocus={() => setIsSearchOpen(true)}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* Search Dropdown */}
          {isSearchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 max-h-96 overflow-y-auto py-2 z-50">
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <Link
                    key={index}
                    href={result.href}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <span className="text-gray-400 group-hover:text-[#EBC170]">
                      {result.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{result.label}</p>
                      {result.breadcrumb && (
                        <p className="text-xs text-gray-400 flex items-center mt-0.5">
                          {result.breadcrumb}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#EBC170]" />
                  </Link>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Tidak ada hasil
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spacer on mobile to push right section */}
      <div className="flex-1 sm:hidden" />

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-white">
          <div className="flex items-center gap-2 px-3 h-14 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder="Cari menu..."
              className="flex-1 py-2 text-sm focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-4rem)]">
            {searchQuery && searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <Link
                  key={index}
                  href={result.href}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors group border-b border-gray-50"
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <span className="text-gray-400">{result.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{result.label}</p>
                    {result.breadcrumb && (
                      <p className="text-xs text-gray-400 mt-0.5">{result.breadcrumb}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))
            ) : searchQuery ? (
              <div className="px-4 py-8 text-sm text-gray-500 text-center">
                Tidak ada hasil
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3">
        {/* Search Icon - Mobile only */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4 text-gray-600" />
        </button>

        {/* Perusahaan Aktif + Company Switcher */}
        <div ref={companyDropdownRef} className="relative">
          <button
            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
            disabled={isSwitchingCompany}
            className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-lg border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] max-w-[16rem] transition-colors cursor-pointer ${isSwitchingCompany ? 'opacity-60' : 'hover:border-gray-300'}`}
            title={activeCompany ? `${activeCompany.name} (${activeCompany.code})` : 'Perusahaan aktif belum tersedia'}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#142D52]/10 text-[#142D52] shrink-0">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {activeCompany?.name || 'Perusahaan tidak tersedia'}
              </p>
              {user?.companies && user.companies.length > 1 && (
                <p className="text-[10px] text-gray-400 leading-tight">Ganti perusahaan</p>
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
        <div className="h-5 w-px bg-gray-200 mx-1.5 hidden md:block"></div>

        {/* Customer Service / Support */}
        <a
          href={SUPPORT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-emerald-600 cursor-pointer"
          title="Hubungi Customer Service"
          aria-label="Hubungi Customer Service via WhatsApp"
        >
          <Headset className="w-[18px] h-[18px]" />
        </a>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-[#142D52] cursor-pointer">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Settings (Profil Perusahaan) */}
        {permissions.includes('company.update') && (
          <Link
            href="/app/company"
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-[#142D52] cursor-pointer hidden md:block"
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
          className="flex items-center gap-2 lg:gap-2.5 pl-2 lg:pl-3 border-l border-gray-100 hover:opacity-80 transition-opacity cursor-pointer"
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
