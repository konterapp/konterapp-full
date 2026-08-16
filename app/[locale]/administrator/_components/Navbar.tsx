'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Search, ChevronRight, Menu, X, Bell, Settings, ShieldCheck } from 'lucide-react';
import { administratorMenuItems } from '../_constants/menuItems';
import { useAdministrator } from '../_context/AdministratorContext';
import { useSidebar } from '../contexts/SidebarContext';

const Navbar = () => {
  const { isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed } = useSidebar();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { administrator } = useAdministrator();

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return administratorMenuItems.filter(item => item.label.toLowerCase().includes(query));
  }, [searchQuery]);

  return (
    <nav
      className="sticky top-0 z-30 h-16 flex items-center justify-between px-3 lg:px-6 shadow-sm border-b border-gray-100"
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
      <div className="hidden sm:flex flex-1 max-w-xl mr-2 lg:mr-6 items-center">
        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors mr-2 cursor-pointer"
            title="Buka sidebar"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        )}
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
          {isSearchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 max-h-96 overflow-y-auto py-2 z-50">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <Link
                    key={result.href}
                    href={result.href}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <span className="text-gray-400 group-hover:text-[#EBC170]">{result.icon}</span>
                    <p className="flex-1 text-sm font-medium text-gray-900">{result.label}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#EBC170]" />
                  </Link>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">Tidak ada hasil</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spacer on mobile */}
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
              searchResults.map((result) => (
                <Link
                  key={result.href}
                  href={result.href}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors group border-b border-gray-50"
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <span className="text-gray-400">{result.icon}</span>
                  <p className="flex-1 text-sm font-medium text-gray-900">{result.label}</p>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))
            ) : searchQuery ? (
              <div className="px-4 py-8 text-sm text-gray-500 text-center">Tidak ada hasil</div>
            ) : null}
          </div>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Search className="w-[18px] h-[18px] text-gray-600" />
        </button>

        {/* Administrator badge */}
        <div
          className="hidden sm:flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] cursor-default"
          title="Platform Administrator"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1E3A]/10 text-[#0B1E3A] shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Platform Administrator</p>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>

        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-[#0B1E3A] cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-[#0B1E3A] cursor-pointer hidden md:block">
          <Settings className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-gray-100">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-[#0B1E3A] leading-none">{administrator?.name || 'Administrator'}</p>
            <p className="text-xs text-gray-500 mt-1">{administrator?.email || ''}</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-gray-100">
            <Image
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(administrator?.name || 'Administrator')}&background=0B1E3A&color=fff`}
              alt="Administrator Avatar"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
