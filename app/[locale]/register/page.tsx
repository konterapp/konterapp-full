import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterClient from "./_components/RegisterClient";

export const metadata: Metadata = {
  title: "Daftar - KonterApp",
  description: "Daftar akun KonterApp gratis untuk mengelola usaha konter dan PPOB Anda",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#142D52]"></div></div>}>
      <RegisterClient />
    </Suspense>
  );
}
