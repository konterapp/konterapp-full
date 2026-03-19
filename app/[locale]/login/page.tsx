import type { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./_components/LoginClient";

export const metadata: Metadata = {
  title: "Login - KonterApp",
  description: "Masuk ke akun KonterApp Anda untuk mengelola bisnis PPOB dan kasir.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#142D52]"></div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}
