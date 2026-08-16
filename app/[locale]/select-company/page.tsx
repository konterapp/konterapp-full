import type { Metadata } from "next";
import { Suspense } from "react";
import CompanyPickerClient from "./_components/CompanyPickerClient";

export const metadata: Metadata = {
  title: "Pilih Perusahaan - KonterApp",
  description: "Pilih perusahaan yang ingin Anda kelola.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SelectCompany() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#142D52]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBC170]"></div>
      </div>
    }>
      <CompanyPickerClient />
    </Suspense>
  );
}
