'use client';

import { AdministratorProvider } from '../_context/AdministratorContext';
import AdministratorNavbar from './AdministratorNavbar';

export default function AdministratorClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdministratorProvider>
      <div className="min-h-screen bg-gray-50">
        <AdministratorNavbar />
        <main className="p-6">{children}</main>
      </div>
    </AdministratorProvider>
  );
}
