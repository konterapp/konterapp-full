'use client';

// Client wrapper untuk admin layout -- menyediakan SidebarProvider dan DashboardWrapper
import DashboardWrapper from './DashboardWrapper';
import ReferralClaimer from './ReferralClaimer';
import { SidebarProvider } from '../contexts/SidebarContext';

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ReferralClaimer />
      <DashboardWrapper>{children}</DashboardWrapper>
    </SidebarProvider>
  );
}
