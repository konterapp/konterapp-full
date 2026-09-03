'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PermissionGuard from './PermissionGuard';
import SubscriptionGuard from './SubscriptionGuard';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { UserProvider } from '../_context/UserContext';
import { useSidebar } from '../contexts/SidebarContext';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const { isCollapsed, setIsCollapsed, sidebarWidth, collapsedWidth } = useSidebar();
  const pathname = usePathname();
  const prevCollapsedRef = useRef<boolean | null>(null);
  const currentWidth = isCollapsed ? collapsedWidth : sidebarWidth;
  const isPosRoot = /\/app\/pos$/.test(pathname || '');

  useEffect(() => {
    if (isPosRoot) {
      if (prevCollapsedRef.current === null) {
        prevCollapsedRef.current = isCollapsed;
        if (!isCollapsed) {
          setIsCollapsed(true);
        }
      }
      return;
    }
    if (prevCollapsedRef.current !== null) {
      setIsCollapsed(prevCollapsedRef.current);
      prevCollapsedRef.current = null;
    }
  }, [pathname, setIsCollapsed, isPosRoot]);

  return (
    <UserProvider>
      {/* h-dvh (bukan h-screen/100vh): di browser HP, 100vh tidak menghitung
          address bar, jadi dgn overflow-hidden bagian bawah konten bisa
          kepotong & tidak bisa discroll -- termasuk baris aksi sticky seperti
          tombol Simpan pada form. Shell administrator sudah memakai ini. */}
      <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
        <Sidebar />
        {/* Lebar sidebar dilewatkan sebagai CSS variable dan margin-nya baru
            dipakai mulai breakpoint lg -- sama seperti Sidebar yang memang
            memakai `lg:translate-x-0`. Sebelumnya margin ini ditentukan state
            `isMobile` yang awalnya false, sehingga di HP render pertama tetap
            memberi margin selebar sidebar lalu dianimasikan balik ke 0 selama
            300ms: navbar terlihat "masuk dari kanan" tiap kali halaman dimuat. */}
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300 relative z-30 ml-0 lg:ml-[var(--sidebar-width)]"
          style={{ '--sidebar-width': `${currentWidth}px` } as React.CSSProperties}
        >
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <SubscriptionGuard>
              <PermissionGuard>{children}</PermissionGuard>
            </SubscriptionGuard>
          </main>
        </div>
        {!isPosRoot && <FloatingWhatsApp />}
      </div>
    </UserProvider>
  );
}
