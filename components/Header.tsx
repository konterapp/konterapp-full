'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from '@/i18n/navigation';
import { getUser } from '@/lib/api/auth';
import { Menu, X } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
}

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { label: 'Beranda', href: '/' },
    { label: 'Fitur', href: '#features' },
    { label: 'Keunggulan', href: '#advantages' },
    { label: 'Testimoni', href: '#testimonials' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await getUser();
      if (response.status === 'success' && response.data) {
        setIsLoggedIn(true);
      }
    } catch {
      // not logged in
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-md shadow-lg bg-white/90' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className={`text-2xl font-bold ${isScrolled ? 'text-[#142D52]' : 'text-white'} tracking-tight`}>
            KonterApp
          </Link>
        </div>

        <nav className="hidden lg:flex items-center space-x-8">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`text-sm font-medium transition-colors duration-200 ${isScrolled ? 'text-gray-700 hover:text-[#142D52]' : 'text-white hover:text-white/80'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg bg-[#142D52] text-white text-sm font-semibold hover:bg-[#0B1E3A] transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className={`text-sm font-semibold transition-colors ${isScrolled ? 'text-[#142D52] hover:text-[#0B1E3A]' : 'text-white hover:text-white/80'
                  }`}
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isScrolled
                  ? 'bg-[#142D52] text-white hover:bg-[#0B1E3A]'
                  : 'bg-white text-[#142D52] hover:bg-white/90'
                  }`}
              >
                Daftar
              </Link>
            </div>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-md ${isScrolled ? 'text-gray-700' : 'text-white'
              }`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
          <nav className="flex flex-col p-4 space-y-3">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 font-medium hover:text-[#142D52] py-2"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
              <Link
                href="/login"
                className="text-center py-2 text-[#142D52] font-semibold border border-[#142D52] rounded-lg"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="text-center py-2 bg-[#142D52] text-white font-semibold rounded-lg"
              >
                Daftar Gratis
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
