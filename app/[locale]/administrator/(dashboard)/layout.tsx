import type { Metadata } from 'next';
import AdministratorClientLayout from '../_components/AdministratorClientLayout';

// Blokir semua halaman administrator dari indexing Google
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdministratorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdministratorClientLayout>{children}</AdministratorClientLayout>;
}
