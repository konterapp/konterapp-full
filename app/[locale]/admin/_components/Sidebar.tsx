'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { logout } from '@/lib/api/auth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { allMenuItems, SubMenuItem } from '../_constants/menuItems';
import { useSidebar } from '../contexts/SidebarContext';
import { filterMenuByAccess } from '@/lib/utils/menuFilter';

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

export default function Sidebar() {
  const {
    isCollapsed, setIsCollapsed,
    sidebarWidth, setSidebarWidth,
    collapsedWidth, collapseThreshold,
    isMobileOpen, setIsMobileOpen,
  } = useSidebar();
  const { permissions, roles, adminScope, isLoading: isLoadingPermissions } = usePermissions();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // On mobile, always show full sidebar (not collapsed)
  const effectiveCollapsed = isMobile ? false : isCollapsed;
  const currentWidth = effectiveCollapsed ? collapsedWidth : sidebarWidth;

  // Auto-expand menu jika submenu aktif
  useEffect(() => {
    allMenuItems.forEach(item => {
      if (item.submenu) {
        const hasActiveChild = item.submenu.some(sub => pathname?.startsWith(sub.href));
        if (hasActiveChild) {
          setExpandedMenus(prev => {
            const newSet = new Set(prev);
            newSet.add(item.label);
            return newSet;
          });
        }
      }
    });
  }, [pathname]);

  // Resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;

      if (newWidth < collapseThreshold) {
        if (!isCollapsed) {
          setIsCollapsed(true);
        }
      } else {
        if (isCollapsed) {
          setIsCollapsed(false);
        }
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, isCollapsed, setIsCollapsed, setSidebarWidth, collapseThreshold]);

  // Double-click toggle collapse
  const handleDoubleClick = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  // Filter menu items menggunakan helper
  const menuItems = filterMenuByAccess(allMenuItems, {
    permissions,
    roles,
    adminScope
  });

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  const hasActiveSubmenu = (submenu?: SubMenuItem[]) => {
    if (!submenu) return false;
    return submenu.some(sub => isActive(sub.href));
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/login');
    }
  };

  return (
    <>
    {/* Mobile backdrop */}
    {isMobileOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={() => setIsMobileOpen(false)}
      />
    )}
    <aside
      className={`fixed left-0 top-0 h-full z-50 ${isResizing ? '' : 'transition-all duration-300'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      style={{ width: currentWidth, backgroundColor: '#142D52' }}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className={`flex items-center p-4 border-b border-white/10 ${effectiveCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!effectiveCollapsed && (
            <div className="flex-1 flex items-center justify-center">
              <Image
                src="/images/ic-eventbyid.png"
                alt="Logo"
                width={120}
                height={120}
                className="h-8 w-auto"
              />
            </div>
          )}
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer hidden lg:block"
          >
            {effectiveCollapsed ? (
              <ChevronRight className="w-5 h-5 text-white" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-white" />
            )}
          </button>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer lg:hidden"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className={`flex-1 p-4 space-y-2 ${effectiveCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {isLoadingPermissions ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg animate-pulse"
              >
                <div className="w-5 h-5 bg-white/20 rounded"></div>
                {!effectiveCollapsed && (
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  </div>
                )}
              </div>
            ))
          ) : (
            menuItems.map((item, index) => {
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus.has(item.label);
              const isItemActive = item.href ? isActive(item.href) : hasActiveSubmenu(item.submenu);

              if (hasSubmenu && item.submenu) {
                return (
                  <div key={index} className="space-y-1 relative group/menu">
                    <button
                      onClick={() => !effectiveCollapsed && toggleMenu(item.label)}
                      className={`cursor-pointer w-full flex items-center ${effectiveCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg transition-all duration-200 group ${isItemActive
                        ? 'bg-[#EBC170] text-gray-900'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <div className={`flex items-center ${effectiveCollapsed ? '' : 'space-x-3 flex-1 min-w-0'}`}>
                        <span className={isItemActive ? 'text-gray-900' : 'text-white/80 group-hover:text-white'}>
                          {item.icon}
                        </span>
                        {!effectiveCollapsed && (
                          <span className="flex-1 font-medium text-left truncate">{tMenu(item.label)}</span>
                        )}
                      </div>
                      {!effectiveCollapsed && (
                        <span className={isItemActive ? 'text-gray-900' : 'text-white/60'}>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </button>
                    {/* Popup submenu for collapsed state */}
                    {effectiveCollapsed && (
                      <div className="absolute left-full top-0 ml-3 py-2 bg-gradient-to-br from-[#1a3a5c] to-[#142D52] rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-50 min-w-[220px] border border-white/20 backdrop-blur-sm">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/10 mb-2 bg-gradient-to-r from-[#EBC170]/20 to-transparent">
                          <div className="flex items-center gap-2">
                            <span className="text-[#EBC170]">{item.icon}</span>
                            <span className="text-white font-semibold">{tMenu(item.label)}</span>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute left-0 top-5 -translate-x-full border-8 border-transparent border-r-[#1a3a5c]"></div>
                        {/* Submenu items */}
                        <div className="px-2 space-y-1">
                          {item.submenu?.map((subItem, subIndex) => {
                            const isSubActive = isActive(subItem.href);
                            return (
                              <Link
                                key={subIndex}
                                href={subItem.href}
                                onClick={closeMobileSidebar}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${isSubActive
                                  ? 'bg-[#EBC170] text-gray-900 shadow-md'
                                  : 'text-white/80 hover:bg-white/15 hover:text-white hover:translate-x-1'
                                  }`}
                              >
                                <div className="flex items-center space-x-2">
                                  {subItem.icon && <span className={isSubActive ? 'text-gray-900' : 'opacity-70'}>{subItem.icon}</span>}
                                  <span className="text-sm font-medium">{tMenu(subItem.label)}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {!effectiveCollapsed && isExpanded && (
                      <div className="ml-4 space-y-1 border-l-2 border-white/10 pl-2">
                        {item.submenu?.map((subItem, subIndex) => {
                          const isSubActive = isActive(subItem.href);
                          return (
                            <Link
                              key={subIndex}
                              href={subItem.href}
                              onClick={closeMobileSidebar}
                              className={`flex items-center justify-between px-2 py-2.5 rounded-lg transition-all duration-200 group ${isSubActive
                                ? 'bg-white/15 text-white font-medium'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                              <div className="flex items-center space-x-2">
                                {subItem.icon && <span className="opacity-80">{subItem.icon}</span>}
                                <span className="text-sm">{tMenu(subItem.label)}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Menu item tanpa submenu
              if (!item.href) return null;

              return (
                <div key={index} className="relative group/menu">
                  <Link
                    href={item.href}
                    onClick={closeMobileSidebar}
                    className={`flex items-center ${effectiveCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-all duration-200 group ${isItemActive
                      ? 'bg-[#EBC170] text-gray-900'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <span className={isItemActive ? 'text-gray-900' : 'text-white/80 group-hover:text-white'}>
                      {item.icon}
                    </span>
                    {!effectiveCollapsed && (
                      <span className="flex-1 font-medium">{tMenu(item.label)}</span>
                    )}
                  </Link>
                  {/* Tooltip for collapsed state */}
                  {effectiveCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2.5 bg-gradient-to-br from-[#1a3a5c] to-[#142D52] text-white text-sm rounded-xl whitespace-nowrap opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-50 shadow-2xl border border-white/20">
                      <div className="flex items-center gap-2">
                        <span className="text-[#EBC170]">{item.icon}</span>
                        <span className="font-semibold">{tMenu(item.label)}</span>
                      </div>
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[#1a3a5c]"></div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-white/10 relative group/logout">
          <button
            onClick={handleLogout}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-white/80 hover:bg-white/10 hover:text-white cursor-pointer ${effectiveCollapsed ? 'justify-center' : ''
              }`}
          >
            <LogOut className="w-5 h-5" />
            {!effectiveCollapsed && <span className="font-medium">Keluar</span>}
          </button>
          {/* Tooltip for collapsed state */}
          {effectiveCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2.5 bg-gradient-to-br from-red-600 to-red-700 text-white text-sm rounded-xl whitespace-nowrap opacity-0 invisible group-hover/logout:opacity-100 group-hover/logout:visible transition-all duration-300 z-50 shadow-2xl border border-red-400/30">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="font-semibold">Keluar</span>
              </div>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-red-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle - hidden on mobile */}
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize group/resize z-50 hover:w-1.5 hidden lg:block"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className={`h-full w-full transition-colors ${isResizing ? 'bg-[#EBC170]' : 'bg-transparent group-hover/resize:bg-white/30'}`} />
      </div>
    </aside>
    </>
  );
}
