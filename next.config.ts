import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import { version } from './package.json';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Baileys (npm: @whiskeysockets/baileys) & qrcode harus dimuat sebagai
  // modul eksternal di sisi server (bukan dibundle Next.js) -- package ini
  // berat & bergantung pada native/dynamic-require (ws, protobufjs, dsb).
  serverExternalPackages: ['@whiskeysockets/baileys', 'qrcode'],
  // IP LAN ikut didaftarkan supaya bisa dites langsung dari HP di Wi-Fi yang
  // sama tanpa lewat Cloudflare Tunnel -- jalur itu punya cache edge sendiri
  // yang bisa menyajikan chunk lama.
  allowedDevOrigins: [
    'konterapp-wsl.linkinvite.id',
    'konterapp.linkinvite.id',
    '192.168.1.111',
    '192.168.1.245',
  ],
  // Matikan indikator dev Next.js (lingkaran "N" mengambang di kiri bawah).
  // Di layar HP ia menutupi konten & tombol di sudut itu. Hanya tampil saat
  // development, jadi tidak berpengaruh ke production.
  devIndicators: false,
  async headers() {
    if (process.env.NODE_ENV === 'production') return [];
    return [
      // Dev: chunk Turbopack TIDAK selalu content-hashed (hash-nya berbasis
      // modul graph, jadi edit kode sering tidak mengubah nama file). Plus
      // Cloudflare override header di sini menjadi `max-age=14400` (Browser
      // Cache TTL 4 jam), jadi cache `max-age` biasa bikin browser/edge
      // menyajikan chunk lama sampai kedaluwarsa. `no-store` adalah satu-satunya
      // yang tidak bisa dioverride Cloudflare/browser: setiap full reload pasti
      // fetch fresh dari origin. Sisi positifnya, HMR (WebSocket) tetap yang
      // menangani edit biasa tanpa reload, jadi tidak perlu cache lama.
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
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
