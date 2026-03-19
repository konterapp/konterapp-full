import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import Providers from "@/components/providers/Providers";

export const preferredRegion = "sin1";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#142D52',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: 'KonterApp - Aplikasi Kasir & PPOB Terlengkap untuk Usaha Konter Anda',
    template: '%s',
  },
  description: 'Solusi lengkap untuk usaha konter dan PPOB. Kelola transaksi pulsa, paket data, token PLN, e-wallet, dan pembukuan kasir digital dalam satu aplikasi. Gratis pendaftaran!',
  keywords: ['KonterApp', 'Aplikasi Konter', 'PPOB', 'Kasir Digital', 'POS', 'Pulsa', 'Token PLN', 'E-Wallet', 'Pembukuan Usaha', 'Manajemen Toko'],
  authors: [{ name: 'KonterApp' }],
  openGraph: {
    title: 'KonterApp - Aplikasi Kasir & PPOB Terlengkap untuk Usaha Konter Anda',
    description: 'Solusi lengkap untuk usaha konter dan PPOB. Kelola transaksi dan pembukuan dalam satu aplikasi.',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KonterApp - Aplikasi Kasir & PPOB Terlengkap',
    description: 'Solusi lengkap untuk usaha konter dan PPOB. Kelola transaksi dan pembukuan dalam satu aplikasi.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <Providers>
        {children}
      </Providers>
    </NextIntlClientProvider>
  );
}
