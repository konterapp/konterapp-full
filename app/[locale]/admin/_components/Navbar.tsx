'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Link as LocaleLink } from '@/i18n/navigation';
import { Search, ChevronRight, Home, Menu, X } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { allMenuItems } from '../_constants/menuItems';
import { useUser } from '../_context/UserContext';
import { useSidebar } from '../contexts/SidebarContext';
import ImpersonateButton from './ImpersonateButton';

// AdminMenu translations (id)
const menuTranslations: Record<string, string> = {
  "Dashboard": "Dashboard",
  "Berita": "Berita",
  "Kemitraan": "Kemitraan",
  "Events": "Events",
  "Publikasi Event": "Publikasi Event",
  "Daftar Event": "Daftar Event",
  "Tambah Event": "Tambah Event",
  "Event Unggulan": "Event Unggulan",
  "Event OTW": "Event OTW",
  "Event Banner": "Event Banner",
  "Sebaran Event": "Sebaran Event",
  "Kategori Event": "Kategori Event",
  "Top 10 KEN": "Top 10 KEN",
  "Hotel Manager": "Hotel Manager",
  "Daftar Hotel": "Daftar Hotel",
  "Buat Hotel Baru": "Buat Hotel Baru",
  "Venue Manager": "Venue Manager",
  "Daftar Venue": "Daftar Venue",
  "Buat Venue Baru": "Buat Venue Baru",
  "Hotel Pusat": "Hotel Pusat",
  "Pengajuan Pemda": "Pengajuan Pemda",
  "Pengajuan Baru": "Pengajuan Baru",
  "Telah Diverifikasi": "Telah Diverifikasi",
  "Revisi": "Revisi",
  "Ditolak": "Ditolak",
  "Hotel Pemda": "Hotel Pemda",
  "Venue Pusat": "Venue Pusat",
  "Venue Pemda": "Venue Pemda",
  "Aset Digital": "Aset Digital",
  "Stok Gambar": "Stok Gambar",
  "Stok Video": "Stok Video",
  "Template Dokumen": "Template Dokumen",
  "Monev": "Monev",
  "Laporan Saya": "Laporan Saya",
  "Petugas Monev": "Petugas Monev",
  "Pertanyaan": "Pertanyaan",
  "Grafik Monev": "Grafik Monev",
  "Survey": "Survey",
  "Konsultasi": "Konsultasi",
  "Daftar Konsultasi": "Daftar Konsultasi",
  "Kategori": "Kategori",
  "Dokumen Resmi": "Dokumen Resmi",
  "Daftar Dokumen": "Daftar Dokumen",
  "Halaman Info": "Halaman Info",
  "Profil Organisasi": "Profil Organisasi",
  "Stravent": "Stravent",
  "FAQ": "FAQ",
  "Umum": "Umum",
  "Kategori Event Daerah": "Kategori Event Daerah",
  "Event Daerah": "Event Daerah",
  "Event Nasional": "Event Nasional",
  "Event Internasional": "Event Internasional",
  "MICE": "MICE",
  "Pitching MICE": "Pitching MICE",
  "Daftar RFS": "Daftar RFS",
  "Daftar Incentive": "Daftar Incentive",
  "Hubungi Kami": "Hubungi Kami",
  "User Management": "User Management",
  "Role Management": "Role Management",
  "Activity Logs": "Activity Logs",
  "Proposal Management": "Manajemen Proposal",
  "Proposals": "Proposal",
  "KEN Terpilih": "KEN Terpilih",
  "KEN Proposal Terpilih": "KEN Proposal Terpilih",
  "Proposal KEN": "Proposal KEN",
  "Submissions": "Pengajuan",
  "Pengajuan Telaah Proposal": "Pengajuan Telaah Proposal",
  "Telaah Proposal": "Telaah Proposal",
  "Periode": "Periode",
  "Types": "Tipe",
  "Categories": "Kategori",
  "Organizers": "Penyelenggara",
  "Question Management": "Manajemen Pertanyaan",
  "Questions": "Pertanyaan",
  "Question Groups": "Grup Pertanyaan",
  "Review Questions": "Pertanyaan Review",
  "Review Indicators": "Indikator Review",
  "Curator Management": "Manajemen Kurator",
  "Review Proposal": "Review Proposal",
  "Riwayat Kurasi": "Riwayat Kurasi",
  "Kalender Event": "Kalender Event",
  "Kilasan Data": "Kilasan Data",
  "Daftar Proposal": "Daftar Proposal",
  "Ajukan Proposal": "Ajukan Proposal",
  "Informasi": "Informasi",
  "Data Spasial": "Data Spasial",
  "Peta Sebaran Event": "Peta Sebaran Event",
  "Proposal": "Proposal",
  "AI Insight": "AI Insight",
  "Pengaturan": "Pengaturan",
  "Logout": "Keluar",
};

const tMenu = (key: string): string => menuTranslations[key] || key;

const Navbar = () => {
  const { permissions } = usePermissions();
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [isMobileSearchOpen]);
  const { user } = useUser();
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

  return (
    <nav
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-3 lg:px-6 shadow-sm"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 cursor-pointer"
      >
        {isMobileOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
      </button>

      {/* Search Bar - Desktop */}
      <div className="flex-1 max-w-xl mr-2 lg:mr-6 hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari menu..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EBC170] focus:border-transparent"
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
          <div className="flex items-center gap-2 px-3 h-16 border-b border-gray-200">
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
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
        {/* Search Icon - Mobile only */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Search className="w-[18px] h-[18px] text-gray-600" />
        </button>

        {/* Landing Page Button */}
        <LocaleLink
          href="/"
          className="inline-flex items-center justify-center gap-2 p-1.5 sm:p-2 md:px-4 md:py-2 bg-[#EBC170] text-gray-900 rounded-lg hover:bg-[#d4ab5f] transition-colors font-semibold text-sm"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Kembali ke Beranda</span>
        </LocaleLink>

        {/* Stop Impersonating Button */}
        <ImpersonateButton />

        {/* User Profile */}
        <Link
          href="/admin/profile"
          className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name || ''}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={
                user?.avatar_url && user.avatar_url.trim() !== ''
                  ? user.avatar_url
                  : user?.name
                    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=EBC170&color=1f2937`
                    : 'https://ui-avatars.com/api/?name=Guest&background=EBC170&color=1f2937'
              }
              alt="User Avatar"
              width={40}
              height={40}
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
