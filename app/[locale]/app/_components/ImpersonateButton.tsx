'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { apiRequest } from '@/lib/api/api';
import { useToast } from '@/components/toast/ToastContainer';
import { useUser } from '../_context/UserContext';

export default function ImpersonateButton() {
  const toast = useToast();
  const { user } = useUser();
  const [isStopping, setIsStopping] = useState(false);

  // Only render if user data indicates impersonating
  const isImpersonating = (user as any)?.impersonating === true;

  if (!isImpersonating) {
    return null;
  }

  const handleStopImpersonating = async () => {
    setIsStopping(true);
    try {
      const response = await apiRequest<any>('/api/app/impersonate/stop', {
        method: 'POST',
      });

      if (response.status === 'success') {
        toast.success('Berhasil kembali ke admin');
        window.location.href = '/app';
      } else {
        toast.error(response.message || 'Gagal kembali ke admin');
        setIsStopping(false);
      }
    } catch {
      toast.error('Terjadi kesalahan');
      setIsStopping(false);
    }
  };

  return (
    <button
      onClick={handleStopImpersonating}
      disabled={isStopping}
      className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      title={`Sedang login sebagai ${user?.name}`}
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden md:inline">
        {isStopping ? 'Menghentikan...' : 'Kembali ke Admin'}
      </span>
    </button>
  );
}
