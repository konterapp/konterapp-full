'use client';

import { ToastProvider } from '@/components/toast/ToastContainer';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
