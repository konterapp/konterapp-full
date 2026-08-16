'use client';

// Client wrapper untuk administrator layout -- menyediakan SidebarProvider dan DashboardWrapper
import DashboardWrapper from './DashboardWrapper';
import { SidebarProvider } from '../contexts/SidebarContext';

export default function AdministratorClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardWrapper>{children}</DashboardWrapper>
    </SidebarProvider>
  );
}
