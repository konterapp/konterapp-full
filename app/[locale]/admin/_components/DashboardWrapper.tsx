'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PermissionGuard from './PermissionGuard';
import { UserProvider } from '../_context/UserContext';
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
    <UserProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
        <Sidebar />
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300 relative z-30"
          style={{ marginLeft: isMobile ? 0 : `${currentWidth}px` }}
        >
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <PermissionGuard>{children}</PermissionGuard>
          </main>
          <footer className="shrink-0 flex items-center justify-between px-4 lg:px-6 py-2 bg-white border-t border-gray-200">
            <span className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} KonterApp
            </span>
          </footer>
        </div>
      </div>
    </UserProvider>
  );
}
