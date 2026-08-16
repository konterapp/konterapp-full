import type { Metadata } from 'next';
import AdminClientLayout from './_components/AdminClientLayout';

// Blokir semua halaman admin dari indexing Google
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
