import type { Metadata } from "next";
import { Suspense } from "react";
import AdministratorLoginClient from "./_components/AdministratorLoginClient";

export const metadata: Metadata = {
  title: "Administrator Login - KonterApp",
  description: "Masuk sebagai administrator platform KonterApp.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdministratorLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-[#0B1E3A] via-[#0E2545] to-[#142D52]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBC170]"></div>
      </div>
    }>
      <AdministratorLoginClient />
    </Suspense>
  );
}
