import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import { version } from './package.json';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  allowedDevOrigins: ['konterapp-wsl.linkinvite.id', 'konterapp.linkinvite.id'],
  async headers() {
    if (process.env.NODE_ENV === 'production') return [];
    return [
      // Chunk Turbopack di dev sudah content-hashed (mis.
      // `components_ea791e35._.js`), jadi kode berubah = nama file berubah =
      // URL baru. Aman di-cache, dan wajib di-cache: dev server diakses dari HP
      // lewat Cloudflare Tunnel, dan satu halaman menarik ~4 MB JS yang tanpa
      // ini di-download ulang tiap navigasi.
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
      // Sisanya (RSC payload, endpoint HMR, /_next/image) tetap no-store: URL-nya
      // tidak ikut berubah saat isinya berubah, jadi kalau Cloudflare/browser
      // menyimpannya HP bisa dapat payload basi + chunk baru sekaligus, yang
      // muncul sebagai hydration mismatch & tampilan yang tidak ikut berubah.
      {
        source: '/_next/:path((?!static/).*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  silent: !process.env.SENTRY_AUTH_TOKEN,
});
