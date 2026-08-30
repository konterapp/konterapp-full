'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const isPosRoot = /\/app\/pos$/.test(pathname || '');

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

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
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
        <Sidebar />
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300 relative z-30"
          style={{ marginLeft: isMobile ? 0 : `${currentWidth}px` }}
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
