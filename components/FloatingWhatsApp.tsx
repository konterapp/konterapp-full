'use client';

import { useEffect, useState } from 'react';
import WhatsAppIcon from './icons/WhatsAppIcon';
import { SUPPORT_WHATSAPP_URL } from '@/lib/support';

const STORAGE_KEY = 'konterapp-floating-wa-label-dismissed';

export default function FloatingWhatsApp() {
  const href = SUPPORT_WHATSAPP_URL;
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStorage.getItem(STORAGE_KEY) !== '1') {
        setShowLabel(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const dismissLabel = () => {
    setShowLabel(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  return (
    // Disembunyikan di layar HP: tombol mengambang ini menutupi sudut kanan
    // bawah, yang di mobile justru dipakai konten & baris aksi sticky (mis.
    // tombol Simpan pada form). Akses ke CS tetap ada lewat ikon headset di
    // navbar, yang memang selalu tampil termasuk di mobile.
    <div className="fixed bottom-2 right-2 z-50 hidden sm:flex items-center gap-2">
      {showLabel && (
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-full pl-3 pr-1.5 py-1.5 shadow-md">
          Butuh Bantuan?
          <button
            type="button"
            onClick={dismissLabel}
            aria-label="Tutup label bantuan"
            className="w-4 h-4 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat WhatsApp"
        className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-500/30 flex items-center justify-center cursor-pointer"
      >
        <WhatsAppIcon className="w-5 h-5 text-white" />
      </a>
    </div>
  );
}
