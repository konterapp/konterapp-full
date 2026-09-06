'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAdministrator } from '@/lib/api/administrator/auth';
import { ChevronLeft, LogOut, X, ShieldCheck } from 'lucide-react';
import { administratorMenuItems } from '../_constants/menuItems';
import { useSidebar } from '../contexts/SidebarContext';

export default function Sidebar() {
  const {
    isCollapsed, setIsCollapsed,
    sidebarWidth, setSidebarWidth,
    collapsedWidth, collapseThreshold,
    isMobileOpen, setIsMobileOpen,
  } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    setAppVersion(process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0');
  }, []);

  // On mobile, always show full sidebar (not collapsed)
  const effectiveCollapsed = isMobile ? false : isCollapsed;
  const currentWidth = effectiveCollapsed ? collapsedWidth : sidebarWidth;

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

  const isActive = (href: string) => {
    if (href === '/administrator') {
      return pathname === '/administrator';
    }
    return pathname === href;
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutAdministrator();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/administrator/login');
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
      className={`fixed left-0 top-0 h-dvh z-50 ${isResizing ? '' : 'transition-all duration-300'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      // Di mobile lebarnya TIDAK ikut sidebarWidth desktop (bisa sampai 400px
      // & tersimpan di localStorage) -- di HP 360px itu bikin drawer lebih
      // lebar dari layar. Dibatasi 85% lebar layar, maksimum 320px.
      style={{
        width: isMobile ? 'min(85vw, 320px)' : currentWidth,
        backgroundColor: '#0B1E3A',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className={`flex items-center p-4 border-b border-white/10 ${effectiveCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!effectiveCollapsed && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="bg-[#EBC170] p-1.5 rounded-lg text-[#0B1E3A]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">Administrator</span>
              </div>
            </div>
          )}
          {effectiveCollapsed && (
            <div className="w-full flex justify-center">
              <div className="bg-[#EBC170] p-1.5 rounded-lg text-[#0B1E3A]">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          )}
          {/* Desktop collapse toggle */}
          {!effectiveCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer hidden lg:block"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer lg:hidden"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className={`flex-1 p-4 space-y-1 ${effectiveCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
          {administratorMenuItems.map(item => {
            const isItemActive = isActive(item.href);
            return (
              <div key={item.label} className="relative group/menu">
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
                    <span className="flex-1 font-medium">{item.label}</span>
                  )}
                </Link>
                {/* Tooltip for collapsed state */}
                {effectiveCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2.5 bg-gradient-to-br from-[#132b52] to-[#0B1E3A] text-white text-sm rounded-xl whitespace-nowrap opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-50 shadow-2xl border border-white/20">
                    <div className="flex items-center gap-2">
                      <span className="text-[#EBC170]">{item.icon}</span>
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[#0B1E3A]"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/10 relative group/logout">
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

        {!effectiveCollapsed && appVersion && (
          <div className="px-3 pb-2 text-center">
            <span className="text-sm font-semibold text-white/40 tracking-wide">
              {`v${appVersion}`}
            </span>
          </div>
        )}
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
