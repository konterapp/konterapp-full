'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AdministratorProvider } from '../_context/AdministratorContext';
import { useSidebar } from '../contexts/SidebarContext';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const { isCollapsed, sidebarWidth, collapsedWidth } = useSidebar();
  const currentWidth = isCollapsed ? collapsedWidth : sidebarWidth;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <AdministratorProvider>
      {/* h-dvh (bukan h-screen/100vh): di browser HP, 100vh tidak menghitung
          address bar, jadi dgn overflow-hidden bagian bawah konten bisa
          kepotong & tidak bisa discroll. */}
      <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
        <Sidebar />
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300 relative z-30"
          style={{ marginLeft: isMobile ? 0 : `${currentWidth}px` }}
        >
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdministratorProvider>
  );
}
